export const load = async ({ locals, params }) => {
	return {
		user: locals.user ?? null
	};
};