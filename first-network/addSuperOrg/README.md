## Adding SuperOrg to the test network

You can use the `addSuperOrg.sh` script to add another organization to the Fabric test network. The `addSuperOrg.sh` script generates the SuperOrg crypto material, creates an SuperOrg organization definition, and adds SuperOrg to a channel on the test network.

You first need to run `./network.sh up createChannel` in the `first-network` directory before you can run the `addSuperOrg.sh` script.

```
./network.sh up createChannel
cd addSuperOrg
./addSuperOrg.sh up
```

If you used `network.sh` to create a channel other than the default `mychannel`, you need pass that name to the `addsuperOrg.sh` script.

```
./network.sh up createChannel -c channel1
cd addSuperOrg
./addSuperOrg.sh up -c channel1
```

You can also re-run the `addSuperOrg.sh` script to add SuperOrg to additional channels.

```
cd ..
./network.sh createChannel -c channel2
cd addSuperOrg
./addSuperOrg.sh up -c channel2
```

For more information, use `./addSuperOrg.sh -h` to see the `addSuperOrg.sh` help text.
