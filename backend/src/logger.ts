import log from 'loglevel';
import { LogLevelDesc } from 'loglevel';
const logLevelEnv = (process.env.LOG_LEVEL == undefined) ? "INFO" : process.env.LOG_LEVEL.toUpperCase();

function convertLogLevel(level: string) : LogLevelDesc {
    let uLevel=level.toUpperCase();
    if (["0","TRACE","T"].includes(level)) {
        return "TRACE" 
    } else if (["1","DEBUG","D"].includes(level)) {
        return "DEBUG"
    } else if (["2","INFO","INFORMATION","I"].includes(level)) {
        return "INFO"
    } else if (["3","WARN","WARNING","W"].includes(level)) {
        return "WARN"
    } else if (["4","ERROR","E"].includes(level)) {
        return "ERROR"
    } else if (["5","SILENT","S","NONE","N"].includes(level)) {
        return "SILENT"
    }
    return "INFO"    
}

export const currentLogLevel=(convertLogLevel(logLevelEnv));

console.log("Initializing logging at level: ",currentLogLevel);
log.setLevel(currentLogLevel);

export default log;
