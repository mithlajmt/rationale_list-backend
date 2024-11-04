const Rationale = require('./../models/Rationale');
const DecisionList = require('./../models/Decisons');
const SpecialtiesList = require('./../models/specialityList');
const RationaleDecision = require('./../models/rDesicion');
const rSpecialities = require('./../models/rSpeciality');
const rModifier = require('./../models/modifier');
const Procedure = require('./../models/procedure');
const modifier = require('./../models/modifier');


const getCompleteRationale = async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.pageSize) || 8;
    const groupID = parseInt(req.query.GroupID);
    const specialtyCode = req.query.SpecialtyCode;

    try {
        // Define initial match conditions
        const matchConditions = {};

        if (groupID) {
            matchConditions.GroupID = groupID;
        }

        // Define the pipeline with a facet to get both count and paginated results
        const pipeline = [
            { 
                $match: matchConditions 
            },
            {
                $lookup: {
                    from: "specialties",
                    localField: "RationaleID",
                    foreignField: "RationaleID",
                    as: "specialties"
                }
            },
            // { 
            //     $unwind: "$specialties" 
            // },
            {
                $match: specialtyCode ? { "specialties.SpecialtyCode": specialtyCode } : {}
            },
            { 
                $sort: { Sequence: 1 } 
            },
            {
                $facet: {
                    totalData: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "totalDocuments" }
                    ]
                }
            }
        ];

        const result = await Rationale.aggregate(pipeline);
        // console.log("Result:", result[0].totalCount);

        // Extract the results and count from the facet output
        const completeRationale = result[0].totalData;
        const totalDocuments = result[0].totalCount.length > 0 ? result[0].totalCount[0].totalDocuments : 0;
        const totalPages = Math.ceil(totalDocuments / limit);

        if (completeRationale.length > 0) {
            res.status(200).json({
                success: true,
                message: "Rationale data retrieved successfully.",
                data: completeRationale,
                pagination: {
                    totalDocuments,
                    totalPages,
                    currentPage: page,
                    pageSize: limit
                }
            });
        } else {
            res.status(204).json({
                success: false,
                message: "No Rationale data found.",
                data: [],
                pagination: {
                    totalDocuments,
                    totalPages,
                    currentPage: page,
                    pageSize: limit
                }
            });
        }
    } catch (error) {
        console.error("Error in getCompleteRationale:", error);

        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving rationale data.",
            error: error.message || "Unknown error"
        });
    }
};





const getRationaleData = async (req, res) => {
    try {
        // Convert RationaleID to a number and perform aggregation
        const rationale = await Rationale.aggregate([
            {
                $match: { "RationaleID": +req.params.id }
            },
            {
                $lookup: {
                    from: 'decisions',
                    localField: 'RationaleID',
                    foreignField: 'RationaleID',
                    as: 'decision'
                }
            },
            {
                $lookup: {
                    from: 'specialties',
                    localField: 'RationaleID',
                    foreignField: 'RationaleID',
                    as: 'specialties'
                }
            },
            {
                $lookup: {
                    from: 'modifiers',
                    localField: 'RationaleID',
                    foreignField: 'RationaleID',
                    as: 'modifiers'
                }
            },
            {
                $lookup: {
                    from: 'procedures',
                    localField: 'RationaleID',
                    foreignField: 'rationaleID',
                    as: 'procedures'
                }
            }
        ]);


        // If rationale data is not found
        if (rationale.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No data found for RationaleID: ${req.params.id}`,
                data: []
            });
        }

        // Success response
        res.status(200).json({
            success: true,
            message: "Rationale data retrieved successfully.",
            data: rationale
        });

    } catch (error) {
        console.error("Error fetching rationale data:", error);

        // Error handling based on the type of error
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            res.status(400).json({
                success: false,
                message: "Invalid RationaleID format.",
                error: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: "An internal server error occurred while retrieving the rationale data.",
                error: error.message // You might hide this in production for security reasons
            });
        }
    }
};



const updateRationale = async (req, res) => {
    const { rationaleSummary, rationaleText, Enable, Module, Decision, specialties, modifiers, procedures,GroupID } = req.body;

    // Check for missing required fields
    if (!rationaleSummary || !rationaleText || Enable === undefined || !Module || !Decision || !specialties) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields.",
        });
    }

    try {
        // Retrieve all DecisionText values from DecisionList and convert to array
        const decisions = await DecisionList.find({});
        const decisionTexts = decisions.map(d => d.DecisionText);

        // Check if the provided decision matches any DecisionText
        if (!decisionTexts.includes(Decision)) {
            return res.status(400).json({
                success: false,
                message: "Provided decision does not match any valid decision text.",
            });
        }

        // Retrieve SpecialtyCodes from SpecialtiesList for validation
        const specialtiesList = await SpecialtiesList.find({});
        const validSpecialtyCodes = specialtiesList.map(s => s.SpecialtyCode);

        // Validate each specialty code in specialties
        const invalidSpecialties = specialties.filter(s => !validSpecialtyCodes.includes(s.SpecialtyCode));
        if (invalidSpecialties.length > 0) {
            return res.status(400).json({
                success: false,
                message: "One or more SpecialtyCodes are invalid.",
                invalidSpecialties,
            });
        }

        // Find the rationale by RationaleID
        const rationaleToUpdate = await Rationale.findOne({ RationaleID: req.params.id });
        if (!rationaleToUpdate) {
            return res.status(404).json({
                success: false,
                message: "Rationale not found.",
                data: null,
            });
        }

        // Update RationaleDecision if the decision is valid
        await RationaleDecision.findOneAndUpdate(
            { RationaleID: req.params.id },
            { $set: { Decision } }
        );

        // Update rationale
        await Rationale.updateOne(
            { RationaleID: req.params.id },
            {
                $set: {
                    RationaleSummary: rationaleSummary,
                    RationalText: rationaleText,
                    Enable,
                    Module,
                    GroupID
                },
            }
        );

        // Process each specialty in specialties
        for (const specialty of specialties) {
            const { Enable, SpecialtyCode } = specialty;

            const existingSpecialty = await rSpecialities.findOne({ RationaleID: req.params.id, SpecialtyCode });
            if (existingSpecialty) {
                await rSpecialities.updateOne(
                    { RationaleID: req.params.id, SpecialtyCode },
                    { $set: { Enable } }
                );
            } else {
                await rSpecialities.create({ RationaleID: req.params.id, SpecialtyCode, Enable });
            }
        }

        // Process modifiers
        if (modifiers) {
            const existingModifier = await modifier.findOne({ RationaleID: req.params.id });
            if (existingModifier) {
                // Update the existing modifier
                await modifier.updateOne(
                    { RationaleID: req.params.id },
                    { $set: { ModifierList: modifiers } }
                );
            } else {
                // Create a new modifier if it doesn't exist
                await modifier.create({ RationaleID: req.params.id, ModifierList: modifiers });
            }
        }

        // Process procedures
        if (procedures && Array.isArray(procedures)) {
            for (const procedure of procedures) {
                const { _id, from:serviceCodeFrom, to:serviceCodeTo, serviceCode:serviceCodeList } = procedure;

                // Check if the procedure exists based on ID
                if (_id) {
                    const existingProcedure = await Procedure.findOne({ _id: _id, RationaleID: req.params.id });
                    if (existingProcedure) {
                        // Update existing procedure
                        await Procedure.updateOne(
                            { _id: _id },
                            { $set: { serviceCodeFrom, serviceCodeTo, serviceCodeList } }
                        );
                    }
                } else {
                    // Add new procedure if ID doesn't exist
                    await Procedure.create({
                        rationaleID: req.params.id,
                        serviceCodeFrom,
                        serviceCodeTo,
                        serviceCodeList,
                    });
                }
            }
        }

        // Successful update response
        res.status(200).json({
            success: true,
            message: "Rationale, specialties, modifiers, and procedures updated successfully.",
            data: req.body,
        });

    } catch (error) {
        console.error("Error in updateRationale:", error);

        // Respond with error details
        res.status(500).json({
            success: false,
            message: "An error occurred while updating rationale.",
            error: error.message || "Unknown error",
        });
    }
};






const getDecisionList = async (req, res) => {
    try {
        // Fetch decision data from decisionList sheet using xlsx library
        const decisionList = await DecisionList.find({});

        res.status(200).json({
            success: true,
            message: "Decision data retrieved successfully.",
            data: decisionList
        });
    } catch (error) {
        console.error("Error fetching decision data:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving decision data. Please try again later.",
            error: error.message
        });
    }
};

const getSpecialityList = async (req, res) => {
    try {
        // Fetch decision data from decisionList sheet using xlsx library
        const specialityList = await SpecialtiesList.find({});

        res.status(200).json({
            success: true,
            message: "Decision data retrieved successfully.",
            data: specialityList
        });
    } catch (error) {
        console.error("Error fetching decision data:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving decision data. Please try again later.",
            error: error.message
        });
    }
};


const addRationale = async (req, res) => {
    const { rationaleSummary, rationaleText, Enable, Module, Decision, specialties, modifiers, procedures,GroupID } = req.body;

    // Check for missing required fields
    if (!rationaleSummary || !rationaleText || Enable === undefined || !Module || !Decision || !specialties) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields.",
        });
    }

    try {
        // Retrieve all DecisionText values from DecisionList and convert to array
        const decisions = await DecisionList.find({});
        const decisionTexts = decisions.map(d => d.DecisionText);

        // Check if the provided decision matches any DecisionText
        if (!decisionTexts.includes(Decision)) {
            return res.status(400).json({
                success: false,
                message: "Provided decision does not match any valid decision text.",
            });
        }

        // Retrieve SpecialtyCodes from SpecialtiesList for validation
        const specialtiesList = await SpecialtiesList.find({});
        const validSpecialtyCodes = specialtiesList.map(s => s.SpecialtyCode);

        // Validate each specialty code in specialties
        const invalidSpecialties = specialties.filter(s => !validSpecialtyCodes.includes(s.SpecialtyCode));
        if (invalidSpecialties.length > 0) {
            return res.status(400).json({
                success: false,
                message: "One or more SpecialtyCodes are invalid.",
                invalidSpecialties,
            });
        }

        // Generate a unique RationaleID
        const maxRationale = await Rationale.findOne().sort({ RationaleID: -1 }).limit(1);
        const newRationaleID = maxRationale ? maxRationale.RationaleID + 1 : 1;
        console.log(newRationaleID);

        // Create new rationale
        const newRationale = new Rationale({
            RationaleID: newRationaleID,
            RationaleSummary: rationaleSummary,
            RationaleText: rationaleText,
            Enable,
            Module,
            GroupID
        });
        await newRationale.save();

        // Create RationaleDecision entry
        await RationaleDecision.create({
            RationaleID: newRationaleID,
            DecisionText:Decision,
        });

        // Add specialties
        for (const specialty of specialties) {
            const { Enable, SpecialtyCode } = specialty;
            await rSpecialities.create({
                RationaleID: newRationaleID,
                SpecialtyCode,
                Enable,
            });
        }

        // Add modifiers if provided
        if (modifiers) {
            await modifier.create({
                RationaleID: newRationaleID,
                ModifierList: modifiers,
            });
        }

        // Add procedures if provided
        if (procedures && Array.isArray(procedures)) {
            for (const procedure of procedures) {
                const { from: serviceCodeFrom, to: serviceCodeTo, serviceCode: serviceCodeList } = procedure;

                await Procedure.create({
                    rationaleID: newRationaleID,
                    serviceCodeFrom,
                    serviceCodeTo,
                    serviceCodeList,
                });
            }
        }

        // Successful creation response
        res.status(201).json({
            success: true,
            message: "Rationale created successfully.",
            data: {
                RationaleID: newRationaleID,
                rationaleSummary,
                rationaleText,
                Enable,
                Module,
                Decision,
                specialties,
                modifiers,
                procedures,
            },
        });

    } catch (error) {
        console.error("Error in addRationale:", error);

        // Respond with error details
        res.status(500).json({
            success: false,
            message: "An error occurred while creating rationale.",
            error: error.message || "Unknown error",
        });
    }
};


module.exports = {
    getCompleteRationale,
    updateRationale,
    getRationaleData,
    getDecisionList,
    getSpecialityList,
    addRationale,
};
