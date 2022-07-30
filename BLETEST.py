import js2py
BLE = js2py.require('HACKPACK Bluetooth') # convert JS lib to python
if __name__ == '__main__': #main function
    BLE.start()
    BLE.send("hello world")
    while (True):
        BLE.read()
        