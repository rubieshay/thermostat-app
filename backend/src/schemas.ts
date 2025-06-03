import { FromSchema } from 'json-schema-to-ts';
import { EcoMode, TempMode } from './types';
import { setEcoMode } from './googlesdm';

export const commands = {
    setHeat: "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat",
    setCool: "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool",
    setRange: "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange",
    setMode: "sdm.devices.commands.ThermostatMode.SetMode",
    setEcoMode: "sdm.devices.commands.ThermostatEco.SetMode",
    setFan: "sdm.devices.commands.ThermostatFanMode.SetMode",
    setEco: "sdm.devices.commands.ThermostatEco.SetMode"
}

export const setHeatSchema = {
  type: 'object',
  properties: {
    heatCelsius: {
        type: "number"
    }
  },
  required: ["heatCelsius" ],
  additionalProperties: false
} as const;

export type SetHeatBody = FromSchema<typeof setHeatSchema>;

export const setCoolSchema = {
  type: 'object',
  properties: {
    coolCelsius: {
        type: "number"
    }
  },
  required: ["coolCelsius" ],
  additionalProperties: false
} as const;

export type SetCoolBody = FromSchema<typeof setCoolSchema>;

export const setRangeSchema = {
  type: 'object',
  properties: {
    coolCelsius: {
        type: "number"
    },
    heatCelsius: {
        type: "number"
    }
  },
  required: ["heatCelsius","coolCelsius" ],
  additionalProperties: false
} as const;

export type SetRangeBody = FromSchema<typeof setRangeSchema>;

export const setModeSchema = {
  type: 'object',
  properties: {
    mode: {
        type: "string",
        enum: [TempMode.off, TempMode.heat, TempMode.cool, TempMode.heatcool]
    }
  },
  required: ["mode"],
  additionalProperties: false
} as const;

export type SetModeBody = FromSchema<typeof setModeSchema>;

export const setEcoModeSchema = {
  type: 'object',
  properties: {
    mode: {
        type: "string",
        enum: [EcoMode.off, EcoMode.on]
    }
  },
  required: ["mode"],
  additionalProperties: false
} as const;

export type SetEcoModeBody = FromSchema<typeof setEcoModeSchema>;

export const latLongQuerySchema = {
    type: 'object',
    properties: {
        lat: {type: "number"},
        long: {type: "number"}
    },
    required: ["lat","long"]
} as const;

export type latLongQueryString = FromSchema<typeof latLongQuerySchema>;
