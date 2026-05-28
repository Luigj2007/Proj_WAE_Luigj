<h1 class="text-2xl text-center my-6">Upload Image</h1>

<form method="POST" enctype="multipart/form-data"
	class="flex flex-col gap-3 w-1/2 mx-auto">

	<input type="file" name="image" required />

	<textarea name="description" placeholder="Description"></textarea>

	<button class="bg-blue-500 text-white p-2 rounded">
		Upload
	</button>

</form>