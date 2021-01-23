import {Readable} from 'stream'
import csvParse from 'csv-parse' // importa a biblioteca de leitura de arquivos CSV
import Contact from '../schema/Contact'
import Tag from '../schema/Tag'

class ImportContacts {
    async run(contactsFileStream: Readable, tags: string[]): Promise<void> { // a função 'run()' recebe uma read stream chamada 'contactsFileStream' e um array de tags
        const parsers = csvParse({
            delimiter: ';' // passa o delimitador de separação de dados
        })

        const parseCSV = contactsFileStream.pipe(parsers) // pega os dados da stream (contatos importados do csv) para cadastro no banco de dados

        const existentTags = await Tag.find({
            title: {
                $in: tags
            }
        })

        const existentTagsTitles = existentTags.map(tag => tag.title)

        const newTagsData = tags
        .filter(tag => !existentTagsTitles.includes(tag))
        .map(tag => ({title: tag}))

        // cria todos os contatos repassando as tags que foram criadas
        const createdTags = await Tag.create(newTagsData) as any
        const tagsIds = createdTags.map(tag => tag._id)

        parseCSV.on('data', async line => { // retorna um array, onde cada índice do array é uma coluna do CSV
            const [email] = line

            await Contact.create({email, tags: tagsIds})

            await Contact.findOneAndUpdate({email}, {$addToSet: {tags: tagsIds}}, {upsert: true})
        })

        await new Promise(resolve => parseCSV.on('end', resolve)) // aguardar a Promise 'resolver'; foi criada uma nova Promise que, quando terminar de ler o CSV, executa-se um 'resolve' para dar o retorno da função 'run()'
    } // a função devolve uma Promise que retorna vazia
}

export default ImportContacts