<script>
    import { createEventDispatcher } from 'svelte'

    export let computers
    const dispatch = createEventDispatcher()

    function inputChanged(e) {
        dispatch('inputChanged', e)
    }
</script>
<div>
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