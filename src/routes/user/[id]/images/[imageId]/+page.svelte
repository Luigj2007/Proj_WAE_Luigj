<script>
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>Image by {data.image.author_username} | Image Blog</title>
</svelte:head>

<header class="sticky top-0 z-50 border-b border-app-line bg-app-surface/95 backdrop-blur">
	<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
		<a
			href={resolve('/')}
			class="text-2xl font-black text-app-ink transition hover:text-app-primary"
		>
			Image Blog
		</a>
		<nav class="flex flex-wrap items-center gap-3">
			<a
				href={resolve('/')}
				class="rounded-md border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink transition hover:-translate-y-0.5 hover:border-app-primary hover:text-app-primary"
			>
				Home
			</a>
			<a
				href={resolve(`/user/${data.image.author_id}`)}
				class="rounded-md bg-app-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-app-primary-dark hover:shadow-md"
			>
				Go to profile
			</a>
		</nav>
	</div>
</header>

<main class="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
	<div
		class="overflow-hidden rounded-lg border border-app-line bg-app-surface shadow-app-soft lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]"
	>
		<section class="border-b border-app-line p-4 sm:p-5 lg:border-r lg:border-b-0">
			<div class="mb-4 flex items-center justify-between gap-3">
				<a
					href={resolve(`/user/${data.image.author_id}`)}
					class="text-sm font-semibold text-app-ink transition hover:text-app-primary hover:underline"
				>
					@{data.image.author_username}
				</a>
			</div>

			<img
				src={data.image.image_url}
				alt={data.image.description || 'Uploaded image'}
				class="max-h-[36rem] w-full rounded-md bg-app-paper object-contain"
			/>

			<div class="mt-5 flex flex-wrap items-center justify-between gap-3">
				<form method="POST" action="?/upvoteImage" class="flex items-center gap-3">
					<input type="hidden" name="id" value={data.image.id} />
					<button
						type="submit"
						class="rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 {data.viewer &&
						data.image.viewer_voted
							? 'bg-app-muted hover:bg-app-ink'
							: 'bg-app-danger hover:bg-red-800'}"
					>
						{data.viewer && data.image.viewer_voted ? 'Upvoted' : 'Upvote'}
					</button>
					<span class="text-sm font-semibold text-app-muted">
						{data.image.vote_count ?? data.image.votes}
						{(data.image.vote_count ?? data.image.votes) === 1 ? 'like' : 'likes'}
					</span>
				</form>
			</div>

			{#if data.image.description}
				<p class="mt-4 text-sm leading-6 text-app-muted">{data.image.description}</p>
			{/if}
		</section>

		<aside class="p-4 sm:p-5">
			<h2 class="mb-4 text-xl font-bold text-app-ink">Comments</h2>

			{#if data.viewer}
				<form method="POST" action="?/addComment" use:enhance class="mb-6 space-y-3">
					<textarea
						name="text"
						rows="3"
						placeholder="Write a comment..."
						class="w-full rounded-md border-app-line p-3 text-sm text-app-ink transition focus:border-app-primary focus:ring-app-primary"
					></textarea>
					<button
						type="submit"
						class="rounded-md bg-app-primary px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-app-primary-dark"
					>
						Post comment
					</button>
				</form>
			{:else}
				<p class="mb-6 rounded-md bg-app-paper px-4 py-3 text-sm text-app-muted">
					<a href={resolve('/login')} class="font-semibold text-app-primary hover:underline"
						>Log in</a
					>
					to add a comment.
				</p>
			{/if}

			<div class="max-h-80 space-y-3 overflow-y-auto pr-1">
				{#each data.comments as comment (comment.id)}
					<div class="rounded-md border border-app-line bg-app-paper p-3 text-sm text-app-muted">
						<div class="flex items-start justify-between gap-3">
							<p>
								<span class="font-semibold text-app-ink">{comment.username}</span>
								{comment.text}
							</p>

							{#if data.viewer && (String(data.viewer.id) === String(comment.user_id) || data.isOwner)}
								<form method="POST" action="?/deleteComment" use:enhance>
									<input type="hidden" name="commentId" value={comment.id} />
									<button
										type="submit"
										class="text-xs font-semibold text-app-danger hover:underline"
									>
										Delete
									</button>
								</form>
							{/if}
						</div>
					</div>
				{:else}
					<p
						class="rounded-md border border-dashed border-app-line px-4 py-8 text-center text-sm text-app-muted"
					>
						No comments yet.
					</p>
				{/each}
			</div>
		</aside>
	</div>
</main>
