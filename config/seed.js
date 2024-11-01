


//RUN   node config/seed.js   to add datas in sheet to database

const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Rationale = require('./../models/Rationale');
const RSpeciality = require('./../models/rSpeciality');
const RDecision = require('./../models/rDesicion');
const RModifiers = require('./../models/modifier');
const fs = require('fs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

const filePath = "/home/mithlajmt/pazl/backend/datatest/Rationale List Manager - Data.xlsx";

const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames; // returns array of sheet names

async function seedDatabase() {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error("File not found");
        } else {
            console.log("File found:", fs.existsSync(filePath));
        }

        console.log("Sheet names:", sheetNames);
        
        // Get the sheets
        const rationaleSheet = workbook.Sheets['Rationale'];
        const specialitySheet = workbook.Sheets['Rationale Specialty'];
        const decisionSheet = workbook.Sheets['Rationale Decision'];
        const modifierScheet = workbook.Sheets['Rationale Modifiers'];

        // Convert sheets to JSON
        const rationales = xlsx.utils.sheet_to_json(rationaleSheet);
        const rSpecialities = xlsx.utils.sheet_to_json(specialitySheet);
        const rDecisions = xlsx.utils.sheet_to_json(decisionSheet);
        const rModifiers = xlsx.utils.sheet_to_json(modifierScheet);

        // Insert into MongoDB collections
        await Rationale.insertMany(rationales.map(r => ({
            RationaleID: r.RationaleID,
            Module: r.Module,
            Source: r.Source,
            RationaleSummary: r.RationaleSummary,
            RationaleText: r.RationaleText,
            Enable: r.Enable === 1,
            GroupID: r.GroupID,
            Sequence: r.Sequence
        })));

        await RSpeciality.insertMany(rSpecialities.map(r => ({
            SpecialtyCode: r.SpecialtyCode,
            Enable: r.Enable === 1,
            RationaleID: r.RationaleID,
            RationaleSpecialtyID: r.RationaleSpecialtyID
        })));

        await RDecision.insertMany(rDecisions.map(r => ({
            DecisionText: r.DecisionText,
            RationaleID: r.RationaleID,
            RationaleDecisionID: r.RationaleDecisionID
        })));

        await RModifiers.insertMany(rModifiers.map(r => ({
            ModifierList: r.ModifierList,
            RationaleID: r.RationaleID,
        })));

        console.log("Database seeded successfully");
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        mongoose.connection.close();
    }
}

seedDatabase();