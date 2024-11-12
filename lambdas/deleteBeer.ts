import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const parameters = event?.pathParameters;
    const breweryName = parameters?.breweryName ? parseInt(parameters.breweryName) : undefined;

    if (!breweryName) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing beer Id" }),
      };
    }

    // Delete the beer from the beers table
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME, // Ensure TABLE_NAME points to the beers table
        Key: { id: breweryName },
      })
    );

    console.log(`Craft beer with ID ${breweryName} deleted successfully.`);

    // Return a success response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ Message: `Craft beer with ID ${breweryName} deleted successfully.` }),
    };
  } catch (error: any) {
    console.error("Error deleting craft beer:", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
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
