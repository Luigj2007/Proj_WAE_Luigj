<script>
	let { form } = $props();
</script>

<div class="flex h-screen items-center justify-center bg-gray-100 px-4">
	<form
		action="?/register"
		method="POST"
		class="w-full max-w-sm space-y-5 rounded-xl bg-white p-8 shadow-xl"
	>
		<h1 class="text-center text-3xl font-bold text-gray-800">📝 Register</h1>

		<div>
			<label for="username" class="mb-1 block text-sm font-medium text-gray-700">Username</label>
			<input
				type="text"
				id="username"
				name="username"
				placeholder="Enter your username"
				required
				class="w-full rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
			<input
				type="password"
				id="password"
				name="password"
				placeholder="Enter your password"
				required
				class="w-full rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-md bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
		>
			➡️ Register
		</button>

		<div class="mt-2 text-center text-sm text-gray-500">
			<a href="/login" class="hover:underline">← Back to Login</a>
		</div>
	</form>
</div>