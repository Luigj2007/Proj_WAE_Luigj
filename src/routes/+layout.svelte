<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-app-paper text-app-ink">
	<div class="flex-1">
		{@render children()}
	</div>

	<footer class="border-t border-app-line bg-app-surface">
		<div
			class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between"
		>
			<p class="font-semibold text-app-ink">Image Blog</p>
			<p>Share thoughtful images, collect feedback, and follow the best posts.</p>
		</div>
	</footer>
</div>
