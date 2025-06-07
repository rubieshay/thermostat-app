import { type FromSchema } from "json-schema-to-ts";
import { EcoMode, FanTimerMode, TempMode } from "./types";

export const setHeatSchema = {
    type: "object",
    properties: {
        deviceID: {
            type: "string"
        },
        heatCelsius: {
            type: "number"
        }
    },
    required: ["deviceID","heatCelsius"],
    additionalProperties: false
} as const;

export type SetHeatBody = FromSchema<typeof setHeatSchema>;

export const setCoolSchema = {
    type: "object",
    properties: {
        deviceID: {
            type: "string"
        },
        coolCelsius: {
            type: "number"
        }
    },
    required: ["deviceID","coolCelsius"],
    additionalProperties: false
} as const;

export type SetCoolBody = FromSchema<typeof setCoolSchema>;

export const setRangeSchema = {
    type: "object",
    properties: {
        deviceID: {
            type: "string"
        },
        coolCelsius: {
            type: "number"
        },
        heatCelsius: {
            type: "number"
        }
    },
    required: ["deviceID","heatCelsius", "coolCelsius"],
    additionalProperties: false
} as const;

export type SetRangeBody = FromSchema<typeof setRangeSchema>;

export const setTempModeSchema = {
    type: "object",
    properties: {
        deviceID: {
            type: "string"
        },
        tempMode: {
            type: "string",
            enum: [TempMode.off, TempMode.heat, TempMode.cool, TempMode.heatcool]
        }
    },
    required: ["deviceID","tempMode"],
    additionalProperties: false
} as const;

export type SetTempModeBody = FromSchema<typeof setTempModeSchema>;

export const setEcoModeSchema = {
    type: "object",
    properties: {
        deviceID: {
            type: "string"
        },
        ecoMode: {
            type: "string",
            enum: [EcoMode.off, EcoMode.on]
        }
    },
    required: ["deviceID","ecoMode"],
    additionalProperties: false
} as const;

export type SetEcoModeBody = FromSchema<typeof setEcoModeSchema>;

export const setFanTimerSchema = {
    type: "object",
    properties: {
        deviceID: {
            type: "string"
        },
        timerMode: {
            type: "string",
            enum: [FanTimerMode.off, FanTimerMode.on]
        },
        durationSeconds: {
            type: "number",
            minimum: 1,
            maximum: 43200
        }
    },
    required: ["deviceID","timerMode"],
    additionalProperties: false
} as const;

export type SetFanTimerBody = FromSchema<typeof setFanTimerSchema>;

export const latLongQuerySchema = {
    type: "object",
    properties: {
        lat: {type: "number"},
        long: {type: "number"}
    },
    required: ["lat", "long"]
} as const;

export type latLongQueryString = FromSchema<typeof latLongQuerySchema>;

export type HeatParams = {
    heatCelsius: number
}

export type CoolParams = {
    coolCelsius: number
}

export type RangeParams = {
    heatCelsius: number,
    coolCelsius: number
}

export type TempModeParams = {
    mode: TempMode
}

export type EcoModeParams = {
    mode: EcoMode
}

export type FanTimerParams = {
    timerMode: FanTimerMode,
    duration?: string
}

export type APIParams = HeatParams | CoolParams | RangeParams | TempModeParams | EcoModeParams | FanTimerParams; 