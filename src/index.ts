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
const removingPluralInType = generatorTypeResponse.data?.substring(0, generatorTypeResponse.data.length - 1)
const generatorFilePathResponse = await adaptQuestion(prompt.select({
  message: `Choose a ${removingPluralInType} type`,
  choices: await getGeneratorFiles(generatorTypeResponse.data || "")
}))

// Verifing Error in Prompt
if(generatorFilePathResponse.status === "exit") process.exit()
if(generatorFilePathResponse.status === "error") ExitProcessError(generatorFilePathResponse.error)
if(generatorFilePathResponse.data === undefined) process.exit()

// Switching between the generator types
// Micro-component -> Create a new micro-component in project already created 
// Template -> Generate a new project from template
switch(generatorTypeResponse.data){
  case "template":
    generateTemplate(generatorFilePathResponse.data)
    break;
  default:
    generateMicroComponent(generatorTypeResponse.data, generatorFilePathResponse.data)
}

// Making Questions
// const questions: QuestionSchema[] = [
//       {
//         select: 
//       },
//       {
//         select: {
//           message: "Choose a template",
//         }
//       }
// ];

// // Running the Prompts
// (
//   async () => {
//     let responses = []
//       for await (const questionData of questions) {
//           const [promptType, question] = Object.entries(questionData).at(0) as [PossiblePromptTypes, QuestionContent<PossiblePromptTypes>]

//           if(question === undefined) throw new Error("Error in Question Structure")

//           if(!promptType) throw new Error("Necessary prompt type in Question Schema")
  
//           const handler = prompt[promptType] as (question: QuestionContent<typeof promptType>) => Promise<any>
  
//           if(!handler) throw new Error("Prompt type not found")
    
//           const questionResponse = await handler(question)
  
//           console.log(questionResponse)
  
//           responses.push({name: question.name, response: questionResponse})
//       }
    
//       console.log(responses)
//   }
// )() 