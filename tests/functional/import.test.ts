import mongoose from 'mongoose'
import Contact from '../../src/schema/Contact'
import Tag from '../../src/schema/Tag'
import {Readable} from 'stream'
import ImportContact from '../../src/services/ImportContacts'

describe('Import', () => {
    beforeAll(async () => {
        if(!process.env.MONGO_URL) {
            throw new Error('MongoDB server not initialized')
        }

        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        })
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    beforeEach(async () => {
        await Contact.deleteMany({})
        await Tag.deleteMany({})
    })

    it('should be able to import new contacts', async () => {
        const contactsFileStream = Readable.from([
            'cassiocappellari@gmail.com\n', // '\n' coloca uma linha em branco após cada contato para simular um CSV onde cada email fica em uma linha
            'tatifff@gmail.com\n',
            'luizacappellari@gmail.com\n'
        ])

        const importContacts = new ImportContact()

        await importContacts.run(contactsFileStream, ['Students', 'Class A'])

        const createdTags = await Tag.find({}).lean() // o método 'lean()' faz com que o retorno do banco de dados MongoDB seja um objeto JavaScript

        expect(createdTags).toEqual([ // verifica se as tags foram criadas
            expect.arrayContaining([
                expect.objectContaining({title: 'Students'}), // teste
                expect.objectContaining({title: 'Class A'})
            ])
        ])

        const createdTagsIds = createdTags.map(tag => tag._id)

        const createdContacts = await Contact.find({}).lean() // o método 'lean()' faz com que o retorno do banco de dados MongoDB seja um objeto JavaScript

        expect(createdContacts).toEqual([ // verifica se os contatos foram criados com as tags
            expect.arrayContaining([
                expect.objectContaining({
                    email: 'cassiocappellari@gmail.com',
                    tags: createdTagsIds
                }),
                expect.objectContaining({
                    email: 'tatifff@gmail.com',
                    tags: createdTagsIds
                }),
                expect.objectContaining({
                    email: 'luizacappellari@gmail.com',
                    tags: createdTagsIds
                })
            ])
        ])
    })
})