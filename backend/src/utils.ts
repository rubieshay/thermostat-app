export enum TempCommands {
    setHeat = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat",
    setCool = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool",
    setRange = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange",
    setMode = "sdm.devices.commands.ThermostatMode.SetMode",
    setEcoMode = "sdm.devices.commands.ThermostatEco.SetMode",
    setFan = "sdm.devices.commands.Fan.SetTimer"
}

export const deviceTypeThermostat = "sdm.devices.types.THERMOSTAT";

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}