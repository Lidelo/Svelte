<script>
    import { downloadBlobAsFile, getValueFromIndex, mapObjectToComputer, convertComputersToXml, convertComputersToTxt } from './Helper'
    import { onMount, afterUpdate, beforeUpdate } from "svelte"
    import convert from 'xml-js'
    export let data
    export let typeOfData
    let computers = []
    $: computers = typeOfData === 'txt'
            ? createComputersFromTxt()
            : createComputersFromXml()
    $: txtData = convertComputersToTxt(computers)
    $: xmlData = convertComputersToXml(computers)

    function saveFile (mode) {
      const blobData = mode === 'txt' ? txtData : xmlData
        console.log(blobData)
        const blob = new Blob([blobData], { type: `text/${mode};charset=utf-8` })
        downloadBlobAsFile(blob, `data.${mode}`)
    }
    function inputChanged (e) {
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
    function createComputersFromTxt () {
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
    function createComputersFromXml () {
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
</script>
<div>
    Zapisz dane do txt:
    <button type="button" id="to-txt-save" on:click={() => saveFile("txt")}>Zapisz do pliku txt</button>
    Zapisz dane do xml:
    <button type="button" id="to-xml-save" on:click={() => saveFile("xml")}>Zapisz do pliku xml</button>
    <div id="table-wrapper">
        <div id="table-scroll">
            <table>
                <tr class="flex">
                    <th class="table-head">Producent</th>
                    <th class="table-head">wielkość matrycy</th>
                    <th class="table-head">rozdzielczość</th>
                    <th class="table-head">typ matrycy</th>
                    <th class="table-head">czy dotykowy ekran</th>
                    <th class="table-head">procesor</th>
                    <th class="table-head">liczba fizycznych rdzeni</th>
                    <th class="table-head">taktowanie</th>
                    <th class="table-head">RAM</th>
                    <th class="table-head">pojemność dysku</th>
                    <th class="table-head">typ dysku</th>
                    <th class="table-head">karta graficzna</th>
                    <th class="table-head">pamięć karty graficznej</th>
                    <th class="table-head">system operacyjny</th>
                    <th class="table-head">napęd optyczny</th>
                </tr>
                {#each computers as { flat }, i}
                <tr class="flex" computer="{i}">
                    {#each Object.entries(flat) as [key, value], i}
                        <th class="flex"><input value="{value}" key="{key}" flat="{i}" on:change="{(e) => inputChanged(e)}" class="cell"></th>
                    {/each}
                </tr>
                {/each}
            </table>
        </div>
    </div>
</div>

<style>
    .flex {
        display: flex;
        flex-direction: row;
    }
    .cell {
        border: none;
        width: 200px;
    }
    .table-head {
        font-weight: 600;
        width: 200px;
    }
    #table-wrapper {
        position:relative;
    }
    #table-scroll {
        height: 100%;
        overflow: auto;
        margin-top: 20px;
    }
    #table-wrapper table {
        width:100%;
    }
</style>