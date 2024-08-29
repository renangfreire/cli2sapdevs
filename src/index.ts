#!/usr/bin/env node

import * as prompt from "@inquirer/prompts"
import * as fs from "fs/promises";

import { generateTemplate } from "./utils/generate-template";
import { generateMicroComponent } from "./utils/generate-micro_component";
import { ExitProcessError } from "./utils/finishProcess";
import { adaptQuestion } from "./adapters/adaptInquirerPrompt";

// Get Possible Generator Choices
async function getGeneratorChoices() {
  const directories = await fs.readdir(new URL('../generators', import.meta.url));

  return directories.map(dir => {
    return {
      value: dir
    }
  });
}

async function getGeneratorFiles(generatorType: string) {
  const files = await fs.readdir(new URL(`../generators/${generatorType}`, import.meta.url));

  return files.map(file => {
    return {
      value: file
    }
  });
}

// Making Generator Type QUESTION #
const generatorTypeResponse = await adaptQuestion(prompt.select({
          message: "Choose a generator type",
          choices: await getGeneratorChoices()
    }))

// Verifing Error in Prompt
if(generatorTypeResponse.data === undefined) process.exit()
if(generatorTypeResponse.status === "exit") process.exit()
if(generatorTypeResponse.status === "error") ExitProcessError(generatorTypeResponse.error)

// Making Generator File QUESTION
const generatorFilePathResponse = await adaptQuestion(prompt.select({
  message: `Choose a ${generatorTypeResponse.data} type`,
  choices: await getGeneratorFiles(generatorTypeResponse.data || "")
}))

// Verifing Error in Prompt
if(generatorFilePathResponse.status === "exit") process.exit()
if(generatorFilePathResponse.status === "error") ExitProcessError(generatorFilePathResponse.error)
if(generatorFilePathResponse.data === undefined) process.exit()

// Switching between the generator types
// Micro-component -> Create a new micro-component in project already created 
// Template -> Generate a new project from template

const generatorData = {
  templatePath: new URL(`../generators/${generatorTypeResponse.data}/${generatorFilePathResponse.data}`, import.meta.url).pathname.substring(1),
  generatorType: generatorTypeResponse.data,
  filePath: generatorFilePathResponse.data
}

switch(generatorTypeResponse.data){
  case "template":
    generateTemplate(generatorData)
    break;
  default:
    generateMicroComponent(generatorData)
}