import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event : any, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    const parameters = event?.pathParameters;

    const body = event.body ? JSON.parse(event.body) : undefined;
    if (!body || typeof body !== "object") {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Invalid or missing request body" }),
      };
    }

    if (!body.brewery || !body.name) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ Message: "Missing brewery or beer name in path parameters" }),
        };
      }

          // Extract userId from the authorizer context (sub from JWT token)
    const userId = event.requestContext.authorizer?.principalId;
    if (!userId) {
      return {
        statusCode: 403,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Unauthorized: Missing user information" }),
      };
    }
  

    const brewery = body.brewery
    const name = body.name

    const command = new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { 
        brewery: brewery, 
        name : name
      },
      UpdateExpression: "SET #id = :id, #release_date = :release_date, #description = :description, #abv = :abv, #style = :style, #rating = :rating",
      ConditionExpression: "createdBy = :userId", // Ensure only creator can update
      ExpressionAttributeNames: {
        "#id" : "id",
        "#release_date" : "release_date",
        "#description" : "description",
        "#abv": "abv",
        "#style": "style",
        "#rating": "rating"
      },
      ExpressionAttributeValues: {
        ":id" : body.id,
        ":release_date" : body.release_date,
        ":description" : body.description,
        ":abv" : body.abv,
        ":style" : body.style,
        ":rating" : body.rating,
        ":userId": userId, // This should match the `createdBy` attribute
      }
    
    });

    const commandOutput = await ddbDocClient.send(command);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Beer item updated successfully",
        updatedItem: commandOutput.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error updating item:", error);
    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 403,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Unauthorized: You do not have permission to update this item" }),
      };
    }
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "An internal server error occurred." }),
    };
  }
};

// Helper function to create DynamoDB Document Client
function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
