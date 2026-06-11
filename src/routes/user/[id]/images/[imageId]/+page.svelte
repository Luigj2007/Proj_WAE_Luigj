<script>
    import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<header class="sticky top-0 z-50 bg-white shadow-md">
	<div class="mx-auto flex max-w-7xl items-center justify-center px-4 py-4">
		<a href={resolve('/')}>
			<h1 class="text-center text-2xl font-bold text-gray-800">📸 InstaClone</h1>
		</a>
	</div>
</header>

<main class="min-h-screen bg-gray-100 px-4 py-10">
	<div class="mb-6 flex justify-center">
		<a href={resolve(`/user/${data.image.author_id}`)} class="inline-block text-sm text-blue-600 hover:underline">
			← Back to User Dashboard
		</a>
	</div>

	<div class="mx-auto mb-10 max-w-5xl overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg lg:flex">
		<div class="flex flex-col gap-3 p-4 lg:w-2/3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a href={resolve(`/user/${data.image.author_id}`)} class="text-sm font-semibold text-gray-700 hover:underline">
						{data.image.author_username}
					</a>
				</div>
			</div>

			<img src={data.image.image_url} alt="Uploaded" class="h-96 w-full rounded-md object-cover" />

			<div class="flex items-center justify-between gap-3">
				<form method="POST" action="?/upvoteImage" class="flex items-center gap-3">
					<input type="hidden" name="id" value={data.image.id} />
					<button type="submit" class="rounded-full px-4 py-2 text-sm font-semibold text-white transition {data.viewer && data.image.viewer_voted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}">
						{data.viewer && data.image.viewer_voted ? 'Upvoted' : '⬆ Upvote'}
					</button>
					<span class="text-sm font-medium text-gray-600">{data.image.votes} {data.image.votes === 1 ? 'like' : 'likes'}</span>
				</form>
			</div>

			<p class="text-sm text-gray-700">{data.image.description}</p>
		</div>

		<div class="border-t border-gray-200 p-5 lg:w-1/3 lg:border-t-0 lg:border-l">
			<h3 class="mb-4 text-lg font-bold text-gray-800">Comments</h3>

			{#if data.viewer}
				<form method="POST" action="?/addComment" use:enhance class="mb-6 space-y-3">
					<textarea
						name="text"
						rows="3"
						placeholder="Write a comment..."
						class="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					></textarea>
					<button type="submit" class="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
						Post comment
					</button>
				</form>
			{:else}
				<p class="mb-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
					<a href={resolve('/login')} class="font-semibold text-blue-600 hover:underline">Log in</a>
					to add a comment.
				</p>
			{/if}

			<div class="mb-6 max-h-60 space-y-3 overflow-y-auto">
				{#each data.comments as comment (comment.id)}
					<div class="flex items-start justify-between rounded bg-gray-50 p-2 text-sm text-gray-700">
						<p><span class="mr-2 font-semibold">{comment.username}</span>{comment.text}</p>

						{#if data.isOwner}
							<form method="POST" action="?/deleteComment" use:enhance class="ml-3">
								<input type="hidden" name="commentId" value={comment.id} />
								<button class="text-xs text-red-500 hover:underline">Delete</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>