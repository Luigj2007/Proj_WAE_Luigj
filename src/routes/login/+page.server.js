import { login } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const actions = {
	login: async ({ request, cookies }) => {
		// Read the submitted credentials from the login form.
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		// Ask the auth helper to validate the credentials.
		const result = await login(username, password);

		if (result?.token) {
			// Store the session token in an HTTP-only cookie.
			cookies.set('session', result.token, {
				maxAge: 60 * 60 * 24 * 7,
				path: '/',
				httpOnly: true,
				sameSite: 'strict'
			});

			throw redirect(302, `/user/${result.user.id}`);
		} else {
			// Show a simple error message on failed login.
			return {
				success: false,
				message: 'Login failed'
			};
		}
	}
};
