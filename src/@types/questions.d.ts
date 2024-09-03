import * as prompt from "@inquirer/prompts"
import { ExtractMethodNames } from "./ts-utils";

type PossiblePromptTypes = ExtractMethodNames<typeof prompt>
type QuestionContent<T extends keyof QuestionSchema> = QuestionSchema[T];
interface BaseQuestionSchema {
  name: string
}

interface QuestionSchema {
    input?: BaseQuestionSchema & Parameters<typeof prompt.input>[0],
    number?: BaseQuestionSchema & Parameters<typeof prompt.number>[0]
    select?: BaseQuestionSchema & Parameters<typeof prompt.select>[0];
    confirm?: BaseQuestionSchema & Parameters<typeof prompt.confirm>[0];
    rawlist?: BaseQuestionSchema & Parameters<typeof prompt.rawlist>[0];
    expand?: BaseQuestionSchema & Parameters<typeof prompt.expand>[0];
    checkbox?: BaseQuestionSchema & Parameters<typeof prompt.checkbox>[0];
    password?: BaseQuestionSchema & Parameters<typeof prompt.password>[0];
    editor?: BaseQuestionSchema & Parameters<typeof prompt.editor>[0];
    search?: BaseQuestionSchema & Parameters<typeof prompt.search>[0]
}