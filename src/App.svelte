<script>
	import { downloadBlobAsFile, getValueFromIndex, mapObjectToComputer, convertComputersToXml, convertComputersToTxt } from './Helper'
	import DataTable from './DataTable.svelte'
	import ReadFile from './ReadFile.svelte'
	import Todos from './Todos.svelte'
	import Info from './Info.svelte'
	import convert from 'xml-js'

	export let name
	let data = ''
	let typeOfData = ''
	let computers = []
	$: computers = typeOfData === 'txt'
			? createComputersFromTxt(data)
			: createComputersFromXml(data)
	$: txtData = convertComputersToTxt(computers)
	$: xmlData = convertComputersToXml(computers)

	function inputChanged (event) {
		const e = event.detail
		const field = e.target.attributes[0].value
		const computerIndex = e.path[2].attributes[1].value
		const parameter = e.target.value
		computers[computerIndex].flat[field] = parameter
		switch (field) {
			case "manufacturer":
				computers[computerIndex].manufacturer = parameter
				break
			case "size":
				computers[computerIndex].screen.size = parameter
				break
			case "resolution":
				computers[computerIndex].screen.resolution = parameter
				break
			case "screen_type":
				computers[computerIndex].screen.screen_type = parameter
				break
			case "touchscreen":
				computers[computerIndex].screen.touchscreen = parameter
				break
			case "name":
				computers[computerIndex].processor.name = parameter
				break
			case "physical_cores":
				computers[computerIndex].processor.physical_cores = parameter
				break
			case "clock_speed":
				computers[computerIndex].processor.clock_speed = parameter
				break
			case "ram":
				computers[computerIndex].ram = parameter
				break
			case "storage":
				computers[computerIndex].disc.storage = parameter
				break
			case  "type":
				computers[computerIndex].disc.type = parameter
				break
			case  "graphics_card_name":
				computers[computerIndex].graphics_card.graphics_card_name = parameter
				break
			case  "memory":
				computers[computerIndex].graphics_card.memory = parameter
				break
			case  "os":
				computers[computerIndex].os = parameter
				break
			case  "disc_reader":
				computers[computerIndex].disc_reader = parameter
				break
		}
		computers = computers
	}
	function createComputersFromTxt (data) {
		if (data === '') return ''
		let objects = []
		data.split('\n').forEach(computer => {
			let object = { screen: {}, processor: {}, disc: {}, graphics_card: {}, flat: {} }
			computer.split(';').forEach((parameter, index) => {
				index < 15 ? object.flat[getValueFromIndex(index)] = parameter : ''
				if (index === 0) {
					object[getValueFromIndex(index)] = parameter
				} else if (index > 0 && index < 5) {//matryca
					object.screen[getValueFromIndex(index)] = parameter
				} else if (index > 4 && index < 8) {//procesor
					object.processor[getValueFromIndex(index)] = parameter
				} else if (index === 8) {//RAM
					object[getValueFromIndex(index)] = parameter
				} else if (index > 8 && index < 11) {//dysk
					object.disc[getValueFromIndex(index)] = parameter
				} else if (index > 10 && index < 13) {// karta
					object.graphics_card[getValueFromIndex(index)] = parameter
				} else if (index === 13) {
					object[getValueFromIndex(index)] = parameter
				} else if (index === 14) {
					object[getValueFromIndex(index)] = parameter
				}
			})
			objects = [...objects, object]
		})
		return objects
	}
	function createComputersFromXml (data) {
		if (data === '') return ''
		let objects = []
		const options = {
			spaces: 4,
			trim: true,
			object: true
		}
		const xmlDataAsJSObject = convert.xml2js(data, options)
		xmlDataAsJSObject.elements[0].elements.forEach(laptop => {
			objects = [...objects, mapObjectToComputer(laptop)]
		})
		return objects
	}
	function saveFile (mode) {
		const blobData = mode === 'txt' ? txtData : xmlData
		console.log(blobData)
		const blob = new Blob([blobData], { type: `text/${mode};charset=utf-8` })
		downloadBlobAsFile(blob, `data.${mode}`)
	}
</script>

<main>
	<h1>Hello {name}!</h1>
	<ReadFile bind:data="{data}" bind:typeOfData="{typeOfData}"></ReadFile>
	{#if data && data !== ''}
		Zapisz dane do txt:
		<button type="button" id="to-txt-save" on:click="{() => saveFile("txt")}">Zapisz do pliku txt</button>
		Zapisz dane do xml:
		<button type="button" id="to-xml-save" on:click="{() => saveFile("xml")}">Zapisz do pliku xml</button>
		<DataTable computers="{computers}" on:inputChanged="{inputChanged}" typeOfData="{typeOfData}"></DataTable>
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