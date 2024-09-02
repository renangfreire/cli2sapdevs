import * as prompt from "@inquirer/prompts"

export type responsesSchema = {
    [key: string]: any
}

import { PossiblePromptTypes, QuestionContent, QuestionSchema } from "../@types/questions"

export async function makeQuestions(selectedQuestions: QuestionSchema[]){
    const responses: responsesSchema = {}
    
      for await (const questionData of selectedQuestions) {
          const [promptType, question] = Object.entries(questionData).at(0) as [PossiblePromptTypes, QuestionContent<PossiblePromptTypes>]

          if(question === undefined) throw new Error("Error in Question Structure")

          if(!promptType) throw new Error("Necessary prompt type in Question Schema")
        
          const handler = prompt[promptType] as (question: QuestionContent<typeof promptType>) => Promise<any>
        
          if(!handler) throw new Error("Prompt type not found")

          const questionResponse = await handler(question)
  
          responses[question.name] = questionResponse
      }
    
      return responses
}