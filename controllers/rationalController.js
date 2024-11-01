const mongoose = require('mongoose');
const Rationale = require('./../models/Rationale');

const getCompleteRationale = async function (req, res) {
    const page = parseInt(req.query.page) || 1;      
    const limit = parseInt(req.query.limit) || 1;

    try {
        const completeRationale = await Rationale.aggregate([
            {
                $lookup: {
                    from: 'decisions',
                    localField: 'RationaleID',
                    foreignField: 'RationaleID',
                    as: 'decisions'
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
                $skip: (page - 1) * limit 
            },
            { 
                $limit: limit 
            }
        ]);

        // Count total documents for calculating total pages
        const totalDocuments = await Rationale.countDocuments();
        const totalPages = Math.ceil(totalDocuments / limit);
        console.log(completeRationale)
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
            res.status(404).json({
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

        // Respond with error details
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving rationale data.",
            error: error.message || "Unknown error"
        });
    }
};


const updateRationale = async (req, res) => {
    try {
        const updatedRationale = await Rationale.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (updatedRationale) {
            res.status(200).json({
                success: true,
                message: "Rationale updated successfully.",
                data: updatedRationale
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Rationale not found.",
                data: null
            });
        }
    } catch (error) {
        console.error("Error in editRationale:", error);

        // Respond with error details
        res.status(500).json({
            success: false,
            message: "An error occurred while updating rationale.",
            error: error.message || "Unknown error"
        });
    }
}

module.exports = {
    getCompleteRationale,
    updateRationale
};
