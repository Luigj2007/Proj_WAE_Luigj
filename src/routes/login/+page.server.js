import { login } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const actions = {
	// Login form action
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username'); // Get username from form
		const password = formData.get('password'); // Get password from form

		const result = await login(username, password); // Try to log in

		if (result?.token) {
			// Set session cookie if login successful
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
				message: 'Login failed'
			};
		}
	}
};