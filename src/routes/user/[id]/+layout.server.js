export const load = async ({ locals }) => {
	// Expose the logged-in user to nested user routes.
	return {
		user: locals.user ?? null
	};
};
