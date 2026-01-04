export const SuccessResponse = (res, data, statusCode = 200) => {
    const response = { success: true, data: data };
    res.status(statusCode).json(response);
};
//# sourceMappingURL=response.js.map