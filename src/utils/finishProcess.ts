export function ExitProcessError(errorMessage: string | undefined){
    if(errorMessage){
        console.error(errorMessage)
    }
    process.exit();
}