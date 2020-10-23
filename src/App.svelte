<script>
	import Info from './Info.svelte'
	import Todos from './Todos.svelte'
	import ReadFile from './ReadFile.svelte'
	import DataTable from './DataTable.svelte'
	export let name
	let data = ''
	let typeOfData = ''
</script>

<main>
	<h1>Hello {name}!</h1>
	<ReadFile bind:data="{data}" bind:typeOfData="{typeOfData}"></ReadFile>
	{#if data && data !== ''}
		<DataTable bind:data="{data}" typeOfData="{typeOfData}"></DataTable>
	{/if}
	<Todos></Todos>
	<Info></Info>
</main>
<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>