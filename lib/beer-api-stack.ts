import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { craftBeers } from "../seed/beers";
import * as apig from "aws-cdk-lib/aws-apigateway";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

// Craft Beer Table
const beersTable = new dynamodb.Table(this, "BeersTable", {
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  partitionKey: { name: "brewery", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "name", type: dynamodb.AttributeType.STRING},
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  tableName: "Beers",
});

// // Brewery Details Table (if you need a separate table for breweries)
// const breweriesTable = new dynamodb.Table(this, "BreweriesTable", {
//   billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
//   partitionKey: { name: "breweryId", type: dynamodb.AttributeType.NUMBER },
//   sortKey: { name: "breweryName", type: dynamodb.AttributeType.STRING },
//   removalPolicy: cdk.RemovalPolicy.DESTROY,
//   tableName: "Breweries",
// });;

    
    // Functions 
    const getBeerByIdFn = new lambdanode.NodejsFunction(this, "GetBeerByIdFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getBeerById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: beersTable.tableName,
        REGION: 'eu-west-1',
      },
    });
      
    const getAllBeersFn = new lambdanode.NodejsFunction(this, "GetAllBeersFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getAllBeers.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: beersTable.tableName,
        REGION: 'eu-west-1',
      },
    });

    const addBeerFn = new lambdanode.NodejsFunction(this, "AddBeerFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/addBeer.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: beersTable.tableName,
        REGION: "eu-west-1",
      },
    });
        
        //Delete Beer Function 
        const deleteBeerFn = new lambdanode.NodejsFunction(this, "DeleteBeerFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/deleteBeer.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: beersTable.tableName,
            REGION: "eu-west-1",
          },
        });

      
      //     Update Beer Lambda Function
        const updateBeerFn = new lambdanode.NodejsFunction(this, "UpdateBeerFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/updateBeer.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: beersTable.tableName,
            REGION: "eu-west-1",
          },
        });
        


        
        new custom.AwsCustomResource(this, "beersddbInitData", {
          onCreate: {
            service: "DynamoDB",
            action: "batchWriteItem",
            parameters: {
              RequestItems: {
                [beersTable.tableName]: generateBatch(craftBeers),
              },
            },
            physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
          },
          policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [beersTable.tableArn],  
          }),
        });
        
        // Permissions 
        beersTable.grantReadData(getBeerByIdFn)
        beersTable.grantReadData(getAllBeersFn)
        beersTable.grantReadWriteData(addBeerFn)
        beersTable.grantReadWriteData(deleteBeerFn)
        beersTable.grantReadWriteData(updateBeerFn);
        
        // REST API 
    const api = new apig.RestApi(this, "RestAPI", {
      description: "demo api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    const beersEndpoint = api.root.addResource("beers");

    beersEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllBeersFn, { proxy: true })
    );
    
    beersEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(addBeerFn, { proxy: true })
    );

    beersEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteBeerFn, { proxy: true })
    );

    beersEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updateBeerFn, { proxy: true })
    );
    
    const beerEndpoint = beersEndpoint.addResource("{brewery}");
    beerEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getBeerByIdFn, { proxy: true })
    );
    


      }
    }
    