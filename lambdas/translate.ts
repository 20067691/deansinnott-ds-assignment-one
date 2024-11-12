import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import apiResponses from './common/apiResponses';
import * as AWS from "aws-sdk";
import { Translate } from "aws-sdk";

const translate = new AWS.Translate();

export const handler: APIGatewayProxyHandlerV2 = async (event: any, context) => {

    const body = JSON.parse(event.body);
    const { text, language } = body;
    if (!text) {
        return apiResponses._400({message : "missing text from body"})
    }
    if(!language) {
        return apiResponses._400({message : "missing language from the body"})
    }

    try{
        const translateParams: Translate.Types.TranslateTextRequest = {
            Text: text,
            SourceLanguageCode: "en",
            TargetLanguageCode: language

        };

        const translatedMessage = await translate.translateText(translateParams).promise()
        return apiResponses._200({translatedMessage})


    } catch (error){
        console.log("error in the translation", error);
        return apiResponses._400({message: "unable to translate the message"});

    }

};