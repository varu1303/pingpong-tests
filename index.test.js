require('@testing-library/jest-dom')
const { JSDOM } = require("jsdom");
//
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

let document, windowAccess

function mockFn(f) {
	let original = windowAccess[f]
	windowAccess[f] = jest.fn()
	return original
}
function restoreFn(f, o) {
	windowAccess[f] = o;
}

describe('HTML Test', function () {
	beforeAll((done) => {
		jest.setTimeout(30000)
		let { window } = new JSDOM(html, {
			url: "http://localhost/",
			resources: 'usable',
			runScripts: 'dangerously'
		})
		window.addEventListener("load", () => {
			document = window.document.body;
			done();
		})
		window.alert = () => { }
		windowAccess = window
	});
	test('finds all nodes', () => {
		let ball = document.querySelector('#ball')
		let rod1 = document.querySelector('#rod1')
		let rod2 = document.querySelector('#rod2')
		expect(ball).toBeDefined()
		expect(rod1).toBeDefined()
		expect(rod2).toBeDefined()
	})
	test('Enter key handled', () => {
		let original = mockFn('handleEnterKey')
		windowAccess.handleKeyPress({
			code: 'Enter'
		});
		expect(windowAccess.handleEnterKey).toHaveBeenCalledTimes(1);
		restoreFn('handleEnterKey', original)
	})
	test('Enter key starts game if not already started', () => {
		let original = mockFn('startGame')
		windowAccess.handleEnterKey();
		expect(windowAccess.startGame).toHaveBeenCalledTimes(1);
		restoreFn('startGame', original)
	})
	test('Ball moves 3px every 10ms', () => {
		jest.useFakeTimers();
		windowAccess.startGame();
		jest.advanceTimersByTime(30);
		let ball = document.querySelector('#ball')
		expect(ball).toHaveStyle({ left: '9px', top: '9px' })
	})
	test('moveRodRight called until the rod hits right edge', () => {
		windowAccess.HTMLElement.prototype.getBoundingClientRect = () => ({
			width: 25,
			x: 465
		});
		windowAccess.innerWidth = 500;
		let original = mockFn('moveRodRight');
		windowAccess.handleKeyPress({
			code: 'KeyD'
		})
		expect(windowAccess.moveRodRight).toHaveBeenCalledTimes(1);
		restoreFn('moveRodRight', original)
	})
	test('moveRodRight not called if rod about to exceed right edge', () => {
		windowAccess.HTMLElement.prototype.getBoundingClientRect = () => ({
			width: 25,
			x: 485
		});
		windowAccess.innerWidth = 500;
		let original = mockFn('moveRodRight');
		windowAccess.handleKeyPress({
			code: 'KeyD'
		})
		expect(windowAccess.moveRodRight).toHaveBeenCalledTimes(0);
		restoreFn('moveRodRight', original)
	})
	test('moveRodLeft called until rod hits left edge', () => {
		windowAccess.HTMLElement.prototype.getBoundingClientRect = () => ({
			width: 25,
			x: 30
		});
		windowAccess.innerWidth = 500;
		let original = mockFn('moveRodLeft');
		windowAccess.handleKeyPress({
			code: 'KeyA'
		})
		expect(windowAccess.moveRodLeft).toHaveBeenCalledTimes(1);
		restoreFn('moveRodLeft', original)
	})
	test('ball reverses direction on hitting edges', () => {
		windowAccess.HTMLElement.prototype.getBoundingClientRect = () => ({
			width: 25,
			x: 200,
			y: 300
		});
		windowAccess.innerWidth = 250;
		jest.useFakeTimers();
		windowAccess.startGame();
		jest.advanceTimersByTime(100); // 10 move calls
		let ball = document.querySelector('#ball')
		expect(ball).toHaveStyle({ left: '224px', top: '330px' })
		jest.advanceTimersByTime(800); // 80 move calls
		expect(ball).toHaveStyle({ left: '14px', top: '570px' })
	})
	test('ball collision handled with rod2', () => {
		let rod1 = document.querySelector('#rod1')
		rod1.offsetHeight = 20;
		let rod2 = document.querySelector('#rod2')
		rod2.offsetHeight = 20;
		windowAccess.innerHeight = 350;
		windowAccess.HTMLElement.prototype.getBoundingClientRect = () => ({
			width: 30,
			x: 200,
			y: 310
		});
		windowAccess.innerWidth = 1250;
		jest.useFakeTimers();
		let original = mockFn('handleCollisionWithRod2');
		windowAccess.startGame();
		jest.advanceTimersByTime(40); // 4 move calls
		let ball = document.querySelector('#ball')
		expect(windowAccess.handleCollisionWithRod2).toHaveBeenCalledTimes(1);
		restoreFn('handleCollisionWithRod2', original)
	})
	test('handleCollisionWithRod1 works', () => {
		let original = mockFn('storeWin');
		let rod = {
			getBoundingClientRect: () => ({
				x: 120
			}),
			offsetWidth: 20
		}
		windowAccess.handleCollisionWithRod1(100, rod)
		windowAccess.handleCollisionWithRod1(145, rod)
		windowAccess.handleCollisionWithRod1(135, rod)
		expect(windowAccess.storeWin).toHaveBeenCalledTimes(2);
		restoreFn('storeWin', original)
	})
	test('handleCollisionWithRod2 works', () => {
		let original = mockFn('storeWin');
		let rod = {
			getBoundingClientRect: () => ({
				x: 120
			}),
			offsetWidth: 20
		}
		windowAccess.handleCollisionWithRod2(100, rod)
		windowAccess.handleCollisionWithRod2(145, rod)
		windowAccess.handleCollisionWithRod2(135, rod)
		expect(windowAccess.storeWin).toHaveBeenCalledTimes(2);
		restoreFn('storeWin', original)
	})
});