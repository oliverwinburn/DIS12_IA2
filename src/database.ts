import { Sequelize, DataTypes, Model, Op } from "sequelize";

export const sequelize = new Sequelize('database', "username", "password", {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.argv.includes('--dbLogging') ? console.log : false,
    benchmark: true
})

export class Readings extends Model {
    static insert: (temperature: number, humidity: number) => Promise<Readings>;
    static fetchAfter: (timestamp: number) => Promise<Readings[]>;
    static id: number;
    static timestamp: number;
    static temperature: number;
    static humidity: number;
}

export class BOMRecordings extends Model {
    static id: number;
    static timestamp: number;
    static temperature: number;
    static apparentTemp: number;
    static humidity: number;
    static insert: (temperatue: number, apparentTemp: number, humidity: number) => Promise<BOMRecordings>;
}


Readings.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    timestamp: DataTypes.INTEGER,
    temperature: DataTypes.FLOAT,
    humidity: DataTypes.FLOAT,
}, {
    timestamps: false,
    sequelize,
    modelName: "Readings"
})


BOMRecordings.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    timestamp: DataTypes.INTEGER,
    temperature: DataTypes.FLOAT,
    apparentTemp: DataTypes.FLOAT,
    humidity: DataTypes.FLOAT,
}, {
    timestamps: false,
    sequelize,
    modelName: "BOMRecordings"
})


Readings.insert = async (temperature: number, humidity: number) => {
    return Readings.create({ temperature, humidity, timestamp: Date.now() })
}

BOMRecordings.insert = async (temperature: number, apparentTemp: number, humidity: number) => {
    return BOMRecordings.create({ temperature, apparentTemp, humidity, timestamp: Date.now() })
}


export async function fetchDBAfter(timestamp: number) {
    const inside = await Readings.findAll({
        where: { timestamp: { [Op.gt]: timestamp } },
        order: [["id", "DESC"]],
        limit: 10,
    })
    const outside = await BOMRecordings.findOne({
        where: { timestamp: { [Op.gt]: timestamp } },
        order: [["id", "DESC"]],
    })
    return {inside, outside}
}
