import { register } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const actions = {
	register: async ({ request, cookies }) => {
		// Read the submitted account details from the form.
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		// Create the user and receive a login session on success.
		const result = await register(username, password);

		if (result.token) {
			// Store the new session in an HTTP-only cookie.
			cookies.set('session', result.token, {
				maxAge: 60 * 60 * 24 * 7,
				path: '/',
				httpOnly: true,
				sameSite: 'strict'
			});

			throw redirect(302, `/user/${result.user.id}`);
		} else {
			// Return the registration error to the page.
			return {
				success: false,
				message: result.message || 'Register failed'
			};
		}
	}
};
