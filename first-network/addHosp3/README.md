## Adding Hosp3 to the test network

You can use the `addHosp3.sh` script to add another organization to the Fabric test network. The `addHosp3.sh` script generates the Hosp3 crypto material, creates an Hosp3 organization definition, and adds Hosp3 to a channel on the test network.

You first need to run `./network.sh up createChannel` in the `first-network` directory before you can run the `addHosp3.sh` script.

```
./network.sh up createChannel
cd addHosp3
./addHosp3.sh up
```

If you used `network.sh` to create a channel other than the default `mychannel`, you need pass that name to the `addhosp3.sh` script.

```
./network.sh up createChannel -c channel1
cd addHosp3
./addHosp3.sh up -c channel1
```

You can also re-run the `addHosp3.sh` script to add Hosp3 to additional channels.

```
cd ..
./network.sh createChannel -c channel2
cd addHosp3
./addHosp3.sh up -c channel2
```

For more information, use `./addHosp3.sh -h` to see the `addHosp3.sh` help text.
