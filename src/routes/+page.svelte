<script>
	export let data;
</script>

<h1 class="text-3xl text-center my-6">Image Blog</h1>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">

	{#each data.images as img}

		<div class="bg-slate-800 rounded-xl overflow-hidden">

			<img src={img.image} class="w-full h-60 object-cover" />

			<div class="p-3">
				<p>{img.description}</p>
				<p>❤️ {img.votes}</p>
			</div>

		</div>

	{/each}

</div>