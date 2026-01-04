import { ZodError } from "zod";
import fs from "fs/promises";
function gatherFiles(req) {
    const files = [];
    if (req.file)
        files.push(req.file);
    if (req.files) {
        if (Array.isArray(req.files)) {
            files.push(...req.files);
        }
        else {
            Object.values(req.files)
                .flat()
                .forEach((file) => {
                files.push(file);
            });
        }
    }
    return files;
}
export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const files = gatherFiles(req);
                const deleteOps = files.map((file) => file.path
                    ? fs.unlink(file.path).catch(console.error)
                    : Promise.resolve());
                await Promise.all(deleteOps);
                throw error;
            }
            next(error);
        }
    };
};
//# sourceMappingURL=validation.js.map