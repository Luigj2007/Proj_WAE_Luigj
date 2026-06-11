<script>
	import { resolve } from '$app/paths';

	let { data } = $props();

</script>

<svelte:head>
	<title>Image Blog</title>
</svelte:head>

<header class="border-b border-gray-200 bg-white/90 backdrop-blur">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
		<div>
			<h1 class="text-3xl font-black tracking-tight text-gray-900">Image Blog</h1>
			<p class="mt-1 text-sm text-gray-500">Top 25 most liked posts</p>
		</div>
		{#if data.user}
			<a href={resolve(`/user/${data.user.id}`)} class="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700">
				My profile
			</a>
		{/if}
	</div>
</header>

<main class="mx-auto max-w-7xl px-4 py-8">
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
		{#each data.images as image (image.id)}
			<article class="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
				<a
					href={resolve(`/user/${image.author_id}/images/${image.id}`)}
					class="absolute inset-0 z-0"
					aria-label={`Open post by ${image.username}`}
				></a>

				<div class="relative z-10 pointer-events-none border-b border-gray-100 px-4 py-4">
					<a href={resolve(`/user/${image.author_id}`)} class="text-sm font-semibold text-gray-900 transition hover:text-blue-600">
						@{image.username}
					</a>
				</div>

				<img src={image.image_url} alt={image.description || 'Uploaded image'} class="relative z-10 h-80 w-full object-cover" />

				<div class="relative z-10 pointer-events-none space-y-4 px-4 py-4">
					{#if image.description}
						<p class="text-sm leading-6 text-gray-600">{image.description}</p>
					{/if}

					<div class="flex items-center justify-between gap-3">
						<form method="POST" action="?/upvoteImage" class="pointer-events-auto flex items-center gap-3">
							<input type="hidden" name="id" value={image.id} />
							<button type="submit" class="rounded-full px-4 py-2 text-sm font-semibold text-white transition {data.user && image.viewer_voted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}">
								{data.user && image.viewer_voted ? 'Upvoted' : '⬆ Upvote'}
							</button>
							<span class="text-sm font-semibold text-gray-700">{image.vote_count ?? image.votes} votes</span>
						</form>

						<a href={resolve(`/user/${image.author_id}/images/${image.id}`)} class="pointer-events-auto text-sm font-medium text-blue-600 transition hover:underline">
							Comments
						</a>
					</div>
				</div>
			</article>
		{/each}
	</div>
</main>