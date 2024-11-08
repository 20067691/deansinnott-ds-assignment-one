#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RestAPIStack } from "../lib/beer-api-stack";

const app = new cdk.App();
new RestAPIStack(app, "AssignmentAPIStack", { env: { region: "eu-west-1" } });
