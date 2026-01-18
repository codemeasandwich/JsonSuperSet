const jss = require('./index')

describe('JSS - JSON SuperSet', () => {

    describe('Primitives', () => {
        test('handles strings', () => {
            const input = { str: 'hello world' }
            const result = jss.parse(jss.stringify(input))
            expect(result.str).toBe('hello world')
        })

        test('handles numbers', () => {
            const input = { int: 42, float: 3.14, neg: -100 }
            const result = jss.parse(jss.stringify(input))
            expect(result.int).toBe(42)
            expect(result.float).toBe(3.14)
            expect(result.neg).toBe(-100)
        })

        test('handles booleans', () => {
            const input = { t: true, f: false }
            const result = jss.parse(jss.stringify(input))
            expect(result.t).toBe(true)
            expect(result.f).toBe(false)
        })

        test('handles null', () => {
            const input = { n: null }
            const result = jss.parse(jss.stringify(input))
            expect(result.n).toBe(null)
        })
    })

    describe('Special Types', () => {
        test('preserves Date objects', () => {
            const date = new Date('2025-01-01T12:00:00Z')
            const input = { created: date }
            const result = jss.parse(jss.stringify(input))
            expect(result.created).toBeInstanceOf(Date)
            expect(result.created.getTime()).toBe(date.getTime())
        })

        test('encodes RegExp objects', () => {
            const regex = /hello/
            const input = { pattern: regex }
            const result = jss.parse(jss.stringify(input))
            // RegExp is encoded/decoded - verify it's a RegExp
            expect(result.pattern).toBeInstanceOf(RegExp)
        })

        test('preserves Error objects', () => {
            const error = new Error('Something went wrong')
            error.name = 'CustomError'
            const input = { err: error }
            const result = jss.parse(jss.stringify(input))
            expect(result.err).toBeInstanceOf(Error)
            expect(result.err.message).toBe('Something went wrong')
            expect(result.err.name).toBe('CustomError')
        })

        test('handles undefined in objects', () => {
            const input = { defined: 'yes', notDefined: undefined }
            const result = jss.parse(jss.stringify(input))
            // undefined properties should round-trip
            expect(result.notDefined).toBe(undefined)
        })

        test('preserves Set objects', () => {
            const set = new Set([1, 2, 3, 'a', 'b'])
            const input = { items: set }
            const result = jss.parse(jss.stringify(input))
            expect(result.items).toBeInstanceOf(Set)
            expect(result.items.has(1)).toBe(true)
            expect(result.items.has('a')).toBe(true)
            expect(result.items.size).toBe(5)
        })

        test('preserves Map objects', () => {
            const map = new Map([['key1', 'value1'], ['key2', 42]])
            const input = { data: map }
            const result = jss.parse(jss.stringify(input))
            expect(result.data).toBeInstanceOf(Map)
            expect(result.data.get('key1')).toBe('value1')
            expect(result.data.get('key2')).toBe(42)
        })
    })

    describe('Objects and Arrays', () => {
        test('handles nested objects', () => {
            const input = {
                user: {
                    name: 'Alice',
                    profile: {
                        age: 30
                    }
                }
            }
            const result = jss.parse(jss.stringify(input))
            expect(result.user.name).toBe('Alice')
            expect(result.user.profile.age).toBe(30)
        })

        test('handles arrays', () => {
            const input = { items: [1, 2, 3, 'four', 'five'] }
            const result = jss.parse(jss.stringify(input))
            expect(result.items).toEqual([1, 2, 3, 'four', 'five'])
        })

        test('handles arrays with Dates', () => {
            const date = new Date('2025-06-15')
            const input = { mixed: ['text', 42, date, null] }
            const result = jss.parse(jss.stringify(input))
            expect(result.mixed[0]).toBe('text')
            expect(result.mixed[1]).toBe(42)
            expect(result.mixed[2]).toBeInstanceOf(Date)
            expect(result.mixed[3]).toBe(null)
        })
    })

    describe('encode/decode', () => {
        test('encode returns tagged object for Date', () => {
            const input = { d: new Date('2025-01-01') }
            const encoded = jss.encode(input)
            expect(encoded['d<!D>']).toBeDefined()
        })

        test('decode restores Date from tagged object', () => {
            const encoded = { 'd<!D>': 1735689600000 }
            const decoded = jss.decode(encoded)
            expect(decoded.d).toBeInstanceOf(Date)
        })

        test('encode handles Error type', () => {
            const input = { e: new Error('test') }
            const encoded = jss.encode(input)
            expect(encoded['e<!E>']).toBeDefined()
        })

        test('encode handles Set type', () => {
            const input = { s: new Set([1, 2]) }
            const encoded = jss.encode(input)
            expect(encoded['s<!S>']).toBeDefined()
        })

        test('encode handles Map type', () => {
            const input = { m: new Map([['a', 1]]) }
            const encoded = jss.encode(input)
            expect(encoded['m<!M>']).toBeDefined()
        })
    })

    describe('Circular References', () => {
        test('handles self-referencing object', () => {
            const original = {
                id: 123,
                name: 'Test'
            }
            original.foo = original

            const encoded = jss.encode(original)
            const result = jss.decode(encoded)

            expect(result.id).toBe(123)
            expect(result.name).toBe('Test')
            expect(result.foo).toBe(result)
        })

        test('handles self-referencing object', () => {
            const original = {
                name: 'Test',
                cat: {
                    cars: true
                },
                bar: {
                    baz: true
                }
            }
            original.cat.foo = original.bar.baz

            const encoded = jss.encode(original)
            const result = jss.decode(encoded)

            expect(result.cat.foo).toBe(result.bar.baz)
        })

        test('handles multiple self-references', () => {
            const original = { id: 1 }
            original.refA = original
            original.refB = original

            const result = jss.decode(jss.encode(original))

            expect(result.refA).toBe(result)
            expect(result.refB).toBe(result)
        })
    })

    describe('Shared References', () => {
        test('shared object referenced twice', () => {
            const shared = { value: 42 }
            const original = {
                first: shared,
                second: shared
            }

            const result = jss.decode(jss.encode(original))

            expect(result.first.value).toBe(42)
            expect(result.second.value).toBe(42)
            expect(result.first).toBe(result.second) // same object reference
        })

        test('shared object in array', () => {
            const shared = { id: 'shared' }
            const original = {
                items: [shared, shared, shared]
            }

            const result = jss.decode(jss.encode(original))

            expect(result.items[0]).toBe(result.items[1])
            expect(result.items[1]).toBe(result.items[2])
        })

        test('deeply nested shared reference', () => {
            const shared = { data: 'test' }
            const original = {
                level1: {
                    level2: {
                        ref: shared
                    }
                },
                otherRef: shared
            }

            const result = jss.decode(jss.encode(original))

            expect(result.level1.level2.ref.data).toBe('test')
            expect(result.level1.level2.ref).toBe(result.otherRef)
        })
    })

    describe('Round-trip', () => {
        test('object with multiple special types survives round-trip', () => {
            const original = {
                id: 123,
                name: 'Test',
                createdAt: new Date(),
                tags: new Set(['a', 'b']),
                meta: new Map([['x', 1]])
            }
            const result = jss.parse(jss.stringify(original))

            expect(result.id).toBe(original.id)
            expect(result.name).toBe(original.name)
            expect(result.createdAt.getTime()).toBe(original.createdAt.getTime())
            expect(result.tags).toBeInstanceOf(Set)
            expect(result.meta).toBeInstanceOf(Map)
        })
    })

    describe('Error Type Reconstruction', () => {
        test('preserves TypeError', () => {
            const error = new TypeError('Not a function')
            const input = { err: error }
            const result = jss.parse(jss.stringify(input))
            expect(result.err).toBeInstanceOf(TypeError)
            expect(result.err.message).toBe('Not a function')
        })

        test('preserves RangeError', () => {
            const error = new RangeError('Out of bounds')
            const input = { err: error }
            const result = jss.parse(jss.stringify(input))
            expect(result.err).toBeInstanceOf(RangeError)
            expect(result.err.message).toBe('Out of bounds')
        })

        test('falls back for custom error name not in global', () => {
            // Manually create encoded error with non-existent error type
            const encoded = { 'err<!E>': ['NonExistentError', 'test message', 'stack trace'] }
            const decoded = jss.decode(encoded)
            expect(decoded.err).toBeInstanceOf(Error)
            expect(decoded.err.name).toBe('NonExistentError')
            expect(decoded.err.message).toBe('test message')
            expect(decoded.err.stack).toBe('stack trace')
        })

        test('falls back when global name exists but is not an Error constructor (line 153)', () => {
            // Use a global that exists but doesn't produce Error: like Array, Object, String
            // global['String']('test') produces 'test' (a string), not an Error
            const encoded = { 'err<!E>': ['String', 'test message', 'stack trace'] }
            const decoded = jss.decode(encoded)
            // Should fall back to generic Error
            expect(decoded.err).toBeInstanceOf(Error)
            expect(decoded.err.name).toBe('String')
            expect(decoded.err.message).toBe('test message')
        })

        test('falls back when global name is a non-constructor (line 153)', () => {
            // Use something that exists but new X() doesn't produce an Error
            const encoded = { 'err<!E>': ['Object', 'test message', 'stack trace'] }
            const decoded = jss.decode(encoded)
            expect(decoded.err).toBeInstanceOf(Error)
            expect(decoded.err.name).toBe('Object')
        })
    })

    describe('Array Type Tags', () => {
        test('handles array of dates', () => {
            const dates = [new Date('2025-01-01'), new Date('2025-06-15')]
            const input = { dates }
            const result = jss.parse(jss.stringify(input))
            expect(result.dates[0]).toBeInstanceOf(Date)
            expect(result.dates[1]).toBeInstanceOf(Date)
        })

        test('handles incomplete array type tag (missing closing bracket)', () => {
            // The tag format is <!...> - if tag starts with [ but lacks ]
            // The regex matches <!...> so we need 'dates<![D,D,D>' where tag is '[D,D,D'
            const encoded = { 'dates<![D,D,D>': [1735689600000, 1750032000000, 1750118400000] }
            const decoded = jss.decode(encoded)
            // Should still decode dates properly after tag reconstruction (adds the missing ])
            expect(decoded.dates[0]).toBeInstanceOf(Date)
            expect(decoded.dates[1]).toBeInstanceOf(Date)
            expect(decoded.dates[2]).toBeInstanceOf(Date)
        })
    })

    describe('Homogeneous Typed Arrays [*D]', () => {
        test('array of all Dates encodes with [*D] syntax', () => {
            const dates = [new Date('2025-01-01'), new Date('2025-06-15'), new Date('2025-12-31')]
            const input = { dates }
            const encoded = jss.encode(input)
            // Should use [*D] shorthand
            expect(encoded['dates<![*D]>']).toBeDefined()
            expect(encoded['dates<![D,D,D]>']).toBeUndefined()
        })

        test('array of all Sets encodes with [*S] syntax', () => {
            const sets = [new Set([1]), new Set([2]), new Set([3])]
            const input = { sets }
            const encoded = jss.encode(input)
            expect(encoded['sets<![*S]>']).toBeDefined()
        })

        test('mixed types do not use * syntax', () => {
            const mixed = [new Date('2025-01-01'), 'string', new Date('2025-06-15')]
            const input = { mixed }
            const encoded = jss.encode(input)
            // Should NOT use [*D] since there's a string in the middle
            expect(encoded['mixed<![*D]>']).toBeUndefined()
            expect(encoded['mixed<![D,,D]>']).toBeDefined()
        })

        test('single element array uses [*D]', () => {
            const dates = [new Date('2025-01-01')]
            const input = { dates }
            const encoded = jss.encode(input)
            expect(encoded['dates<![*D]>']).toBeDefined()
        })

        test('homogeneous array round-trips correctly', () => {
            const dates = [new Date('2025-01-01'), new Date('2025-06-15'), new Date('2025-12-31')]
            const input = { dates }
            const result = jss.parse(jss.stringify(input))
            expect(result.dates).toHaveLength(3)
            expect(result.dates[0]).toBeInstanceOf(Date)
            expect(result.dates[1]).toBeInstanceOf(Date)
            expect(result.dates[2]).toBeInstanceOf(Date)
            expect(result.dates[0].getTime()).toBe(dates[0].getTime())
        })

        test('decodes [*D] syntax correctly', () => {
            const encoded = { 'dates<![*D]>': [1735689600000, 1750032000000, 1767225600000] }
            const decoded = jss.decode(encoded)
            expect(decoded.dates).toHaveLength(3)
            expect(decoded.dates[0]).toBeInstanceOf(Date)
            expect(decoded.dates[1]).toBeInstanceOf(Date)
            expect(decoded.dates[2]).toBeInstanceOf(Date)
        })
    })

    describe('Nested Array Types', () => {
        test('nested array with typed inner: ["a","b",[Date]]', () => {
            const date = new Date('2025-01-01')
            const input = { arr: ['a', 'b', [date]] }
            const result = jss.parse(jss.stringify(input))
            expect(result.arr[0]).toBe('a')
            expect(result.arr[1]).toBe('b')
            expect(result.arr[2]).toBeInstanceOf(Array)
            expect(result.arr[2][0]).toBeInstanceOf(Date)
            expect(result.arr[2][0].getTime()).toBe(date.getTime())
        })

        test('deeply nested: [[Date],[Date]]', () => {
            const date1 = new Date('2025-01-01')
            const date2 = new Date('2025-06-15')
            const input = { arr: [[date1], [date2]] }
            const result = jss.parse(jss.stringify(input))
            expect(result.arr[0][0]).toBeInstanceOf(Date)
            expect(result.arr[1][0]).toBeInstanceOf(Date)
            expect(result.arr[0][0].getTime()).toBe(date1.getTime())
            expect(result.arr[1][0].getTime()).toBe(date2.getTime())
        })

        test('mixed nested: [Date,[Date],Date]', () => {
            const date1 = new Date('2025-01-01')
            const date2 = new Date('2025-06-15')
            const date3 = new Date('2025-12-31')
            const input = { arr: [date1, [date2], date3] }
            const result = jss.parse(jss.stringify(input))
            expect(result.arr[0]).toBeInstanceOf(Date)
            expect(result.arr[1][0]).toBeInstanceOf(Date)
            expect(result.arr[2]).toBeInstanceOf(Date)
        })

        test('decodes nested tag [,,[D]] correctly', () => {
            const encoded = { 'arr<![,,[D]]>': ['a', 'b', [1735689600000]] }
            const decoded = jss.decode(encoded)
            expect(decoded.arr[0]).toBe('a')
            expect(decoded.arr[1]).toBe('b')
            expect(decoded.arr[2][0]).toBeInstanceOf(Date)
        })

        test('decodes nested tag [[*D],[*D]] correctly', () => {
            const encoded = { 'arr<![[*D],[*D]]>': [[1735689600000, 1750032000000], [1767225600000]] }
            const decoded = jss.decode(encoded)
            expect(decoded.arr[0][0]).toBeInstanceOf(Date)
            expect(decoded.arr[0][1]).toBeInstanceOf(Date)
            expect(decoded.arr[1][0]).toBeInstanceOf(Date)
        })

        test('triple nested arrays', () => {
            const date = new Date('2025-01-01')
            const input = { arr: [[['a', date]]] }
            const result = jss.parse(jss.stringify(input))
            expect(result.arr[0][0][0]).toBe('a')
            expect(result.arr[0][0][1]).toBeInstanceOf(Date)
        })
    })

    describe('Binary (I tag) Decoding', () => {
        test('decodes base64 inline binary data to Buffer', () => {
            // "Hello World" in base64
            const encoded = { 'data<!I>': 'SGVsbG8gV29ybGQ=' }
            const decoded = jss.decode(encoded)
            expect(decoded.data).toBeInstanceOf(Buffer)
            expect(decoded.data.toString()).toBe('Hello World')
        })

        test('decodes empty base64 string', () => {
            const encoded = { 'data<!I>': '' }
            const decoded = jss.decode(encoded)
            expect(decoded.data).toBeInstanceOf(Buffer)
            expect(decoded.data.length).toBe(0)
        })

        test('decodes binary data with special characters', () => {
            // Binary with null bytes and high bytes
            const original = Buffer.from([0x00, 0xFF, 0x7F, 0x80])
            const base64 = original.toString('base64')
            const encoded = { 'data<!I>': base64 }
            const decoded = jss.decode(encoded)
            expect(decoded.data).toBeInstanceOf(Buffer)
            expect(decoded.data.equals(original)).toBe(true)
        })
    })

    describe('RegExp Fallback Decoding', () => {
        test('decodes RegExp without delimiters as raw pattern', () => {
            // When the pattern doesn't match /pattern/flags format
            const encoded = { 'pattern<!R>': 'simple-pattern' }
            const decoded = jss.decode(encoded)
            expect(decoded.pattern).toBeInstanceOf(RegExp)
            expect(decoded.pattern.source).toBe('simple-pattern')
            expect(decoded.pattern.flags).toBe('')
        })

        test('decodes standard /pattern/flags format', () => {
            const encoded = { 'pattern<!R>': '/test/gi' }
            const decoded = jss.decode(encoded)
            expect(decoded.pattern).toBeInstanceOf(RegExp)
            expect(decoded.pattern.source).toBe('test')
            expect(decoded.pattern.flags).toBe('gi')
        })

        test('decodes pattern with all flags', () => {
            const encoded = { 'pattern<!R>': '/test/gimsuy' }
            const decoded = jss.decode(encoded)
            expect(decoded.pattern).toBeInstanceOf(RegExp)
            expect(decoded.pattern.flags).toBe('gimsuy')
        })
    })

    describe('Default Plugin Direct Tests', () => {
        const datePlugin = require('./utils/defaults/date')
        const regexpPlugin = require('./utils/defaults/regexp')
        const errorPlugin = require('./utils/defaults/error')
        const undefinedPlugin = require('./utils/defaults/undefined')
        const mapPlugin = require('./utils/defaults/map')
        const setPlugin = require('./utils/defaults/set')
        const pointerPlugin = require('./utils/defaults/pointer')
        const binaryPlugin = require('./utils/defaults/binary')

        describe('Date Plugin', () => {
            test('check returns true for Date objects', () => {
                expect(datePlugin.check('key', new Date())).toBe(true)
                expect(datePlugin.check('key', 'not a date')).toBe(false)
                expect(datePlugin.check('key', 12345)).toBe(false)
            })

            test('encode returns timestamp', () => {
                const date = new Date('2025-01-01T00:00:00Z')
                const encoded = datePlugin.encode([], 'key', date, {})
                expect(encoded).toBe(date.getTime())
            })

            test('decode returns Date object', () => {
                const timestamp = 1735689600000
                const decoded = datePlugin.decode(timestamp, [], {})
                expect(decoded).toBeInstanceOf(Date)
                expect(decoded.getTime()).toBe(timestamp)
            })
        })

        describe('RegExp Plugin', () => {
            test('check returns true for RegExp objects', () => {
                expect(regexpPlugin.check('key', /test/)).toBe(true)
                expect(regexpPlugin.check('key', 'not a regex')).toBe(false)
            })

            test('encode returns string representation', () => {
                const regex = /test/gi
                const encoded = regexpPlugin.encode([], 'key', regex, {})
                expect(encoded).toBe('/test/gi')
            })

            test('decode handles fallback for non-standard format', () => {
                const decoded = regexpPlugin.decode('raw-pattern', [], {})
                expect(decoded).toBeInstanceOf(RegExp)
                expect(decoded.source).toBe('raw-pattern')
            })
        })

        describe('Error Plugin', () => {
            test('check returns true for Error objects', () => {
                expect(errorPlugin.check('key', new Error())).toBe(true)
                expect(errorPlugin.check('key', new TypeError())).toBe(true)
                expect(errorPlugin.check('key', 'not an error')).toBe(false)
            })

            test('encode returns [name, message, stack] array', () => {
                const error = new Error('test message')
                const encoded = errorPlugin.encode([], 'key', error, {})
                expect(Array.isArray(encoded)).toBe(true)
                expect(encoded[0]).toBe('Error')
                expect(encoded[1]).toBe('test message')
                expect(typeof encoded[2]).toBe('string')
            })

            test('decode reconstructs Error object', () => {
                const decoded = errorPlugin.decode(['Error', 'test', 'stack'], [], {})
                expect(decoded).toBeInstanceOf(Error)
                expect(decoded.message).toBe('test')
            })
        })

        describe('Undefined Plugin', () => {
            test('check returns true for undefined', () => {
                expect(undefinedPlugin.check('key', undefined)).toBe(true)
                expect(undefinedPlugin.check('key', null)).toBe(false)
                expect(undefinedPlugin.check('key', '')).toBe(false)
            })

            test('encode returns null', () => {
                const encoded = undefinedPlugin.encode([], 'key', undefined, {})
                expect(encoded).toBe(null)
            })

            test('decode returns undefined', () => {
                const decoded = undefinedPlugin.decode(null, [], {})
                expect(decoded).toBe(undefined)
            })
        })

        describe('Map Plugin', () => {
            test('check returns true for Map objects', () => {
                expect(mapPlugin.check('key', new Map())).toBe(true)
                expect(mapPlugin.check('key', {})).toBe(false)
            })

            test('encode returns object from entries', () => {
                const map = new Map([['a', 1], ['b', 2]])
                const encoded = mapPlugin.encode([], 'key', map, {})
                expect(encoded).toEqual({ a: 1, b: 2 })
            })

            test('decode returns Map object', () => {
                const decoded = mapPlugin.decode({ a: 1, b: 2 }, [], {})
                expect(decoded).toBeInstanceOf(Map)
                expect(decoded.get('a')).toBe(1)
            })
        })

        describe('Set Plugin', () => {
            test('check returns true for Set objects', () => {
                expect(setPlugin.check('key', new Set())).toBe(true)
                expect(setPlugin.check('key', [])).toBe(false)
            })

            test('encode returns array of values', () => {
                const set = new Set([1, 2, 3])
                const encoded = setPlugin.encode([], 'key', set, {})
                expect(encoded).toEqual([1, 2, 3])
            })

            test('decode returns Set object', () => {
                const decoded = setPlugin.decode([1, 2, 3], [], {})
                expect(decoded).toBeInstanceOf(Set)
                expect(decoded.has(2)).toBe(true)
            })
        })

        describe('Pointer Plugin', () => {
            test('check always returns false', () => {
                expect(pointerPlugin.check('key', {})).toBe(false)
                expect(pointerPlugin.check('key', [])).toBe(false)
            })

            test('encode returns path from visitedEncode', () => {
                const obj = { test: true }
                const visitedEncode = new WeakMap()
                visitedEncode.set(obj, ['root', 'child'])
                const encoded = pointerPlugin.encode([], 'key', obj, { visitedEncode })
                expect(encoded).toEqual(['root', 'child'])
            })

            test('decode registers pointer and returns null', () => {
                const pointers2Res = []
                const decoded = pointerPlugin.decode(['target', 'path'], ['source', 'path'], { pointers2Res })
                expect(decoded).toBe(null)
                expect(pointers2Res).toHaveLength(1)
                expect(pointers2Res[0]).toEqual([['target', 'path'], ['source', 'path']])
            })
        })

        describe('Binary Plugin', () => {
            test('check always returns false (decode-only)', () => {
                expect(binaryPlugin.check('key', Buffer.from('test'))).toBe(false)
                expect(binaryPlugin.check('key', 'test')).toBe(false)
            })

            test('encode is null (decode-only)', () => {
                expect(binaryPlugin.encode).toBe(null)
            })

            test('decode returns Buffer in Node.js', () => {
                const decoded = binaryPlugin.decode('SGVsbG8=', [], {})
                expect(decoded).toBeInstanceOf(Buffer)
                expect(decoded.toString()).toBe('Hello')
            })
        })
    })

    describe('Plugin Validation Edge Cases', () => {
        const { clearPlugins } = require('./utils/plugins')

        beforeEach(() => {
            clearPlugins()
        })

        test('throws if onSend is not a function', () => {
            expect(() => jss.custom('X', {
                check: () => false,
                encode: () => {},
                decode: () => {},
                onSend: 'not a function'
            })).toThrow('onSend')
        })

        test('throws if onReceive is not a function', () => {
            expect(() => jss.custom('Y', {
                check: () => false,
                encode: () => {},
                decode: () => {},
                onReceive: 123
            })).toThrow('onReceive')
        })

        test('accepts valid onSend and onReceive functions', () => {
            expect(() => jss.custom('Z', {
                check: () => false,
                encode: () => {},
                decode: () => {},
                onSend: () => ({ replace: null }),
                onReceive: async () => {}
            })).not.toThrow()
        })
    })

    describe('Encode Edge Cases', () => {
        test('encodes object with undefined property at root level (skipped)', () => {
            const input = { a: 1, b: undefined, c: 3 }
            const encoded = jss.encode(input)
            // At root level, undefined values are skipped (line 248 check)
            expect(encoded.a).toBe(1)
            expect(encoded.c).toBe(3)
            // b is skipped at root level
            expect('b<!U>' in encoded).toBe(false)
            expect('b' in encoded).toBe(false)
        })

        test('encodes undefined in nested object (skipped in non-array context)', () => {
            const input = { nested: { a: 1, b: undefined } }
            const encoded = jss.encode(input)
            // Undefined in objects is skipped (line 214 check)
            expect(encoded.nested.a).toBe(1)
            expect('b' in encoded.nested).toBe(false)
        })

        test('encodes array at root level', () => {
            const input = [new Date('2025-01-01'), new Date('2025-06-15')]
            const encoded = jss.encode(input)
            // Root array should have the first element at key "0"
            expect(encoded['0<!D>']).toBeDefined()
            expect(encoded['1<!D>']).toBeDefined()
        })

        test('encodes nested object with all undefined properties', () => {
            const input = {
                nested: {
                    a: undefined,
                    b: undefined
                }
            }
            const result = jss.parse(jss.stringify(input))
            expect(result.nested.a).toBe(undefined)
            expect(result.nested.b).toBe(undefined)
        })

        test('encodes deeply nested array with mixed types', () => {
            const input = {
                data: [
                    [new Date('2025-01-01'), 'text'],
                    [null, new Set([1, 2])]
                ]
            }
            const result = jss.parse(jss.stringify(input))
            expect(result.data[0][0]).toBeInstanceOf(Date)
            expect(result.data[0][1]).toBe('text')
            expect(result.data[1][0]).toBe(null)
            expect(result.data[1][1]).toBeInstanceOf(Set)
        })

        test('encodes empty array', () => {
            const input = { arr: [] }
            const encoded = jss.encode(input)
            expect(encoded.arr).toEqual([])
        })

        test('encodes empty object', () => {
            const input = { obj: {} }
            const encoded = jss.encode(input)
            expect(encoded.obj).toEqual({})
        })
    })

    describe('Decode Edge Cases', () => {
        test('decodes unknown tag as passthrough', () => {
            // Unknown tag should just pass through the value
            const encoded = { 'data<!UNKNOWN>': 'some value' }
            const decoded = jss.decode(encoded)
            expect(decoded.data).toBe('some value')
        })

        test('decodes deeply nested circular reference', () => {
            const original = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep'
                        }
                    }
                }
            }
            original.level1.level2.level3.backRef = original.level1

            const result = jss.parse(jss.stringify(original))
            expect(result.level1.level2.level3.backRef).toBe(result.level1)
        })
    })

    describe('Browser Environment Compatibility', () => {
        test('binary decode falls back to ArrayBuffer when Buffer is unavailable', () => {
            // Simulate browser environment by temporarily hiding Buffer
            const originalBuffer = global.Buffer

            // Define atob for browser simulation (pure JS implementation)
            global.atob = (base64) => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
                let result = ''
                let i = 0
                base64 = base64.replace(/[^A-Za-z0-9+/]/g, '')
                while (i < base64.length) {
                    const a = chars.indexOf(base64[i++])
                    const b = chars.indexOf(base64[i++])
                    const c = chars.indexOf(base64[i++])
                    const d = chars.indexOf(base64[i++])
                    result += String.fromCharCode((a << 2) | (b >> 4))
                    if (c !== -1 && base64[i-2] !== '=') result += String.fromCharCode(((b & 15) << 4) | (c >> 2))
                    if (d !== -1 && base64[i-1] !== '=') result += String.fromCharCode(((c & 3) << 6) | d)
                }
                return result
            }

            // Reset modules to get fresh binary plugin
            jest.resetModules()

            // Now require binary plugin and hide Buffer for the decode call
            const binaryPlugin = require('./utils/defaults/binary')

            delete global.Buffer

            const result = binaryPlugin.decode('SGVsbG8=', [], {})

            // Restore Buffer and cleanup
            global.Buffer = originalBuffer
            delete global.atob

            // Result should be an ArrayBuffer
            expect(result).toBeInstanceOf(ArrayBuffer)
            expect(result.byteLength).toBe(5)

            // Verify the content
            const view = new Uint8Array(result)
            expect(String.fromCharCode(...view)).toBe('Hello')
        })
    })
})
