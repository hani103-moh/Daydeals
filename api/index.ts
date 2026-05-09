console.log("API handler initialized");

export default async (req: any, res: any) => {
    try {
        console.log("Importing server module...");
        // Use a relative path that Vercel can resolve. 
        // Some Vercel environments prefer '.ts' or no extension.
        const module = await import("../server.ts");
        const app = module.default || module.app;
        
        if (!app) {
            throw new Error("Express app not found in server module exports");
        }
        
        console.log("Server module loaded, delegation starts...");
        return app(req, res);
    } catch (err: any) {
        console.error("Vercel Function Error:", err);
        return res.status(500).json({ 
            error: "FUNCTION_INVOCATION_FAILED_DETAILED", 
            message: err.message,
            stack: err.stack,
            path: req.url,
            vercel: true
        });
    }
};
