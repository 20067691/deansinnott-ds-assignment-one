
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = createDDbDocClient();
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const parameters = event?.pathParameters;
    const brewery = parameters?.brewery;
    const name = parameters?.name;
    const targetLanguage = event.queryStringParameters?.language || "en"; // Default to English if no language specified

    console.log("Brewery:", brewery); // Outputs: someBrewery
    console.log("Name:", name);       // Outputs: someBeerName

    if (!brewery || !name) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing brewery or name parameter" }),
      };
    }

    // Get the item from DynamoDB based on brewery and name
    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { brewery, name },
      })
    );

    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Beer not found for the provided brewery and name" }),
      };
    }

    const item = commandOutput.Item;

    // If a different language is requested, translate specified fields
    if (targetLanguage !== "en") {
      const translationFields = ["name", "description"]; // Fields to translate

      for (const field of translationFields) {
        if (item[field]) {
          const translateCommand = new TranslateTextCommand({
            Text: item[field],
            SourceLanguageCode: "en",
            TargetLanguageCode: targetLanguage,
          });
          const translateResult = await translateClient.send(translateCommand);
          item[field] = translateResult.TranslatedText || item[field]; // Replace with translated text
        }
      }
    }

    // Return the item with translated fields if applicable
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ data: item }),
    };
  } catch (error: any) {
    console.log("Error:", JSON.stringify(error));
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

