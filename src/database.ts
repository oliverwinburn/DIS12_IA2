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

Readings.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    timestamp: DataTypes.INTEGER,
    temperature: DataTypes.FLOAT,
    humidity: DataTypes.FLOAT,
}, {
    timestamps: false,
    sequelize,
    modelName: "Readings"
})

Readings.insert = async (temperature: number, humidity: number) => {
    return Readings.create({ temperature, humidity, timestamp: Date.now() })
}

Readings.fetchAfter = async (timestamp: number) => {
    return Readings.findAll({
        where: {
            timestamp: {
                [Op.gt]: timestamp
            }
        },
        order: [["id", "DESC"]],
        limit: 10,
    })
}
