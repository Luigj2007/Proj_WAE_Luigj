import { register } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const actions = {
	// Register form action
	register: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username'); // Get username from form
		const password = formData.get('password'); // Get password from form

		const result = await register(username, password); // Try to register

		if (result.token) {
			// Set session cookie if register successful
			cookies.set('session', result.token, {
				maxAge: 60 * 60 * 24 * 7, // 1 week
				path: '/',
				httpOnly: true,
				sameSite: 'strict'
			});

			throw redirect(302, `/user/${result.user.id}`); // Redirect to user page
		} else {
			// Return failure message
			return {
				success: false,
				message: result.message || 'Register failed'
			};
		}
	}
};