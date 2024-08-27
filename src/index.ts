#!/usr/bin/env node

import * as prompt from "@inquirer/prompts"

interface questionSchema {
    input?: Parameters<typeof prompt.input>[0]    
}

const questions: questionSchema[] = [
  {
    input: {
      "message": "una message"
    }
  }
];

(
  async () => {
    const responses = await Promise.all(questions.map(async questionSchema => {
        const [[promptType, question]] = Object.entries(questionSchema)

        if(!promptType) throw new Error("Necessary prompt type in Question Schema")
    
        const questionResponse = await prompt[promptType](question)
        console.log(questionResponse)

        return {name: question?.name, response: questionResponse}
    }))
  
    console.log(responses)
  }
)()

prompt.select()
