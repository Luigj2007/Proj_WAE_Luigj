<script>
	export let data;
</script>

<img src={data.image.image} class="w-full max-h-[500px]" />

<h2 class="text-xl mt-3">{data.image.description}</h2>

<p>❤️ {data.image.votes}</p>

<hr />

<h3>Comments</h3>

{#each data.comments as c}
	<div class="bg-slate-800 p-3 my-2">
		<b>{c.username}</b>
		<p>{c.text}</p>
	</div>
{/each}

<form method="POST">
	<input name="text" placeholder="Comment..." />
	<button formaction="?/comment">Send</button>
</form>

export const actions = {
	comment: async ({ request, params }) => {

		const data = await request.formData();

		await pool.execute(
			'INSERT INTO comments (image_id, user_id, text) VALUES (?, ?, ?)',
			[params.id, 1, data.get('text')]
		);
	},

	vote: async ({ params }) => {

		await pool.execute(
			'UPDATE images SET votes = votes + 1 WHERE id = ?',
			[params.id]
		);
	}
};