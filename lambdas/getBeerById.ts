import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const parameters = event?.pathParameters;
    const beerId = parameters?.beerId ? parseInt(parameters.beerId) : undefined;

    if (!beerId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing beer Id" }),
      };
    }

    // Fetch the craft beer details
    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: beerId },
      })
    );
    console.log("GetCommand response: ", commandOutput);
    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid beer Id" }),
      };
    }

    const body: { data: any } = {
      data: commandOutput.Item,
    };

    // Fetch brewery information if the query parameter `brewery` is set to "true"
    const queryParams = event.queryStringParameters || {};

    if (queryParams.brewery === "true") {
      const breweryCommandInput: QueryCommandInput = {
        TableName: process.env.BREWERY_TABLE_NAME, // Update to reference your brewery table name in environment
        KeyConditionExpression: "beerId = :b",
        ExpressionAttributeValues: {
          ":b": beerId,
        },
      };

      const breweryCommandOutput = await ddbDocClient.send(
        new QueryCommand(breweryCommandInput)
      );

      if (breweryCommandOutput.Items) {
        body.data.brewery = breweryCommandOutput.Items;
      }
    }

    // Return response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
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
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
