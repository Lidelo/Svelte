<script>
    import { afterUpdate, createEventDispatcher, onMount } from "svelte";
    import { downloadExampleData } from './Helper'
    export let data
    export let typeOfData
    const dispatch = createEventDispatcher();
    onMount(() => {
        document.getElementById('txt').addEventListener('change', readFile, false);
        document.getElementById('xml').addEventListener('change', readFile, false);

        function readFile (evt) {
            var files = evt.target.files;
            var file = files[0];
            var reader = new FileReader();
            reader.onload = event => {
              data = event.target.result
              typeOfData = evt.target.id
            }
            reader.readAsText(file)
        }
    })
</script>

<div>
    Wczytaj dane z txt:
    <input type="file" id="txt" name="file" accept=".txt"/>
    Wczytaj dane z xml:
    <input type="file" id="xml" name="file" accept=".xml"/><br/>
    Pobierz idealnie przykładowe dane do tabeli (.txt):
    <button type="button" on:click={() => downloadExampleData('txt')}>Pobierz data.txt</button>
    Pobierz idealnie przykładowe dane do tabeli (.xml):
    <button type="button" on:click={() => downloadExampleData('xml')}>Pobierz data.xml</button>
</div>