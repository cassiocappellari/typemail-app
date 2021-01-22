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
    })

    it('should be able to import new contacts', async () => {
        const contactsFileStream = Readable.from([
            'cassiocappellari@gmail.com',
            'tatifff@gmail.com',
            'luizacappellari@gmail.com'
        ])

        const importContacts = new ImportContact()

        await importContacts.run(contactsFileStream, ['Students', 'Class A'])

        const createdTags = await Tag.find({})

        expect(createdTags).toEqual([
            expect.objectContaining({title: 'Students'}),
            expect.objectContaining({title: 'Class A'})
        ])

        const createdTagsIds = createdTags.map(tag => tag.id)

        const createdContacts = await Contact.find({})

        expect(createdContacts).toEqual([
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
    })
})