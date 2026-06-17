<script>
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.profileUser.username} | Image Blog</title>
</svelte:head>

<header class="sticky top-0 z-50 border-b border-app-line bg-app-surface/95 backdrop-blur">
	<div
		class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<p class="text-xs font-bold text-app-primary uppercase">Profile</p>
			<h1 class="text-3xl font-black text-app-ink">@{data.profileUser.username}</h1>
		</div>

		<nav class="flex flex-wrap items-center gap-3">
			{#if data.isOwner}
				<a
					href={resolve(`/user/${data.profileUser.id}/new`)}
					class="rounded-md bg-app-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-app-primary-dark hover:shadow-md"
				>
					Add new
				</a>
				<form action="/logout?/logout" method="POST">
					<button
						type="submit"
						class="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-app-danger transition hover:-translate-y-0.5 hover:bg-red-50"
					>
						Logout
					</button>
				</form>
			{/if}

			<a
				href={resolve('/')}
				class="rounded-md border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink transition hover:-translate-y-0.5 hover:border-app-primary hover:text-app-primary"
			>
				Home
			</a>
		</nav>
	</div>
</header>

<main class="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
	{#if !data.isOwner}
		<div
			class="mb-6 rounded-lg border border-app-line bg-app-surface px-4 py-3 text-sm text-app-muted"
		>
			Viewing @{data.profileUser.username}'s posts
		</div>
	{/if}

	{#if data.images.length === 0}
		<section
			class="rounded-lg border border-dashed border-app-line bg-app-surface px-6 py-12 text-center"
		>
			<h2 class="text-xl font-bold text-app-ink">No posts yet</h2>
			<p class="mt-2 text-sm text-app-muted">Images will appear here after they are uploaded.</p>
		</section>
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{#each data.images as image (image.id)}
				<article
					class="relative overflow-hidden rounded-lg border border-app-line bg-app-surface shadow-sm transition hover:-translate-y-1 hover:shadow-app-soft"
				>
					<a
						href={resolve(`/user/${image.author_id}/images/${image.id}`)}
						class="absolute inset-0 z-0"
						aria-label={`Open post by ${image.username}`}
					></a>

					<div class="pointer-events-none relative z-10 border-b border-app-line px-4 py-4">
						<a
							href={resolve(`/user/${image.author_id}`)}
							class="text-sm font-semibold text-app-ink transition hover:text-app-primary"
						>
							@{image.username}
						</a>
					</div>

					<img
						src={image.image_url}
						alt={image.description || 'Uploaded image'}
						class="relative z-10 h-72 w-full object-cover sm:h-80"
					/>

					<div class="pointer-events-none relative z-10 space-y-4 px-4 py-4">
						{#if image.description}
							<p class="text-sm leading-6 text-app-muted">{image.description}</p>
						{/if}

						<div class="flex flex-wrap items-center justify-between gap-3">
							<form
								method="POST"
								action="?/upvoteImage"
								class="pointer-events-auto flex items-center gap-3"
							>
								<input type="hidden" name="id" value={image.id} />
								<button
									type="submit"
									class="rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 {data.viewer &&
									image.viewer_voted
										? 'bg-app-muted hover:bg-app-ink'
										: 'bg-app-danger hover:bg-red-800'}"
								>
									{data.viewer && image.viewer_voted ? 'Upvoted' : 'Upvote'}
								</button>
								<span class="text-sm font-semibold text-app-muted"
									>{image.vote_count ?? image.votes} votes</span
								>
							</form>

							<div class="flex items-center gap-3">
								<a
									href={resolve(`/user/${image.author_id}/images/${image.id}`)}
									class="pointer-events-auto text-sm font-semibold text-app-primary transition hover:text-app-primary-dark hover:underline"
								>
									Comment
								</a>

								{#if data.isOwner}
									<form
										action="?/deleteImage"
										method="POST"
										use:enhance
										class="pointer-events-auto"
									>
										<input type="hidden" name="id" value={image.id} />
										<button
											type="submit"
											class="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-app-danger transition hover:bg-red-50"
										>
											Delete
										</button>
									</form>
								{/if}
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</main>
