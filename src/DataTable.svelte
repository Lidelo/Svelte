<script>
    import { downloadBlobAsFile, getValueFromIndex } from './Helper'
    import { onMount, afterUpdate, beforeUpdate } from "svelte"
    // import convert from 'xml-js'
    export let data
    export let typeOfData
    let txtData = ''
    let xmlData = ''
    let computers = []

    onMount(() => {
        console.log(typeOfData)
        createComputersObject()
    })
    function saveFile (mode) {
        const blob = new Blob([mode === 'txt' ? txtData : xmlData], { type: `text/${mode};charset=utf-8` })
        downloadBlobAsFile(blob, `data.${mode}`)
    }
    function inputChanged (e) {
        computers[e.path[2].attributes[1].value].flat[e.target.attributes[0].value] = e.target.value
        setTxtDataFromComputers()
    }
    function setTxtDataFromComputers () {
        if (computers.length === 0)  return ''
        let localData = ''
        computers.forEach((computer, computersIndex) => {
            Object.entries(computer.flat).forEach((entry, index) => {
                    localData += `${entry[1]};`
                if (computersIndex !== computers.length - 1 && index === 14) {
                    localData += `\n`
                }
            })
        })
        data = txtData = localData
        createComputersObject()
    }
    function createComputersObject () {
        typeOfData === 'txt'
            ? createComputersFromTxt()
            : createComputersFromXml()
    }
    function createComputersFromTxt () {
        computers = []
        data.split('\n').forEach(computer => {
            let object = { matryca: {}, procesor: {}, dysk: {}, "karta graficzna": {}, flat: {} }
            computer.split(';').forEach((parameter, index) => {
                index < 15 ? object.flat[getValueFromIndex(index)] = parameter : ''
                if (index === 0) {
                    object[getValueFromIndex(index)] = parameter
                } else if (index > 0 && index < 5) {//matryca
                    object.matryca[getValueFromIndex(index)] = parameter
                } else if (index > 4 && index < 8) {//procesor
                    object.procesor[getValueFromIndex(index)] = parameter
                } else if (index === 8) {//RAM
                    object[getValueFromIndex(index)] = parameter
                } else if (index > 8 && index < 11) {//dysk
                    object.dysk[getValueFromIndex(index)] = parameter
                } else if (index > 10 && index < 13) {// karta
                    object["karta graficzna"][getValueFromIndex(index)] = parameter
                } else if (index === 13) {
                    object[getValueFromIndex(index)] = parameter
                } else if (index === 14) {
                    object[getValueFromIndex(index)] = parameter
                }
            })
            computers = [...computers, object]
        })
    }
    function createComputersFromXml () {
        computers = []
        // const cos = convert.xml2json(xmlData, {compact: true, spaces: 4})
        // console.log(cos)
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
        height:600px;
        overflow:auto;
        margin-top:20px;
    }
    #table-wrapper table {
        width:100%;
    }
</style>